/**
 * Wasla worker design: Baileys credentials are encrypted before they are written
 * to Neon, so the worker can restart without a local session directory.
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { BufferJSON, initAuthCreds, proto, type AuthenticationState, type SignalDataTypeMap } from "@whiskeysockets/baileys";
import { readDocument, writeDocument } from "@/lib/neon-store";

const AUTH_DOCUMENT_KEY = "whatsapp-baileys-auth-v1";

type StoredAuth = {
  creds: unknown;
  keys: Record<string, Record<string, unknown>>;
};

type EncryptedPayload = {
  version: 1;
  iv: string;
  tag: string;
  ciphertext: string;
};

type DevelopmentPayload = {
  version: 0;
  payload: unknown;
};

function serialise(value: unknown) {
  return JSON.parse(JSON.stringify(value, BufferJSON.replacer)) as unknown;
}

function deserialise<T>(value: unknown) {
  return JSON.parse(JSON.stringify(value), BufferJSON.reviver) as T;
}

function encryptionKey() {
  const configured = process.env.WHATSAPP_SESSION_ENCRYPTION_KEY;
  if (!configured) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("متغير WHATSAPP_SESSION_ENCRYPTION_KEY مطلوب لحماية جلسة واتساب.");
    }
    return null;
  }
  if (configured.length < 32) {
    throw new Error("WHATSAPP_SESSION_ENCRYPTION_KEY يجب أن يكون قيمة عشوائية بطول 32 حرفًا على الأقل.");
  }
  return createHash("sha256").update(configured, "utf8").digest();
}

function protect(payload: StoredAuth): EncryptedPayload | DevelopmentPayload {
  const key = encryptionKey();
  const normalised = serialise(payload);
  if (!key) return { version: 0, payload: normalised };

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(normalised), "utf8"), cipher.final()]);
  return {
    version: 1,
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    ciphertext: ciphertext.toString("base64"),
  };
}

function unprotect(payload: unknown): StoredAuth | null {
  if (!payload || typeof payload !== "object") return null;
  const candidate = payload as Partial<EncryptedPayload> | Partial<DevelopmentPayload>;

  if (candidate.version === 0) {
    const development = candidate as Partial<DevelopmentPayload>;
    return development.payload ? deserialise<StoredAuth>(development.payload) : null;
  }
  const encrypted = candidate as Partial<EncryptedPayload>;
  if (encrypted.version !== 1 || !encrypted.iv || !encrypted.tag || !encrypted.ciphertext) return null;

  const key = encryptionKey();
  if (!key) throw new Error("لا يمكن فك جلسة واتساب المشفرة دون WHATSAPP_SESSION_ENCRYPTION_KEY.");

  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(encrypted.iv, "base64"));
  decipher.setAuthTag(Buffer.from(encrypted.tag, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(encrypted.ciphertext, "base64")),
    decipher.final(),
  ]).toString("utf8");
  return deserialise<StoredAuth>(JSON.parse(plaintext));
}

export async function useNeonAuthState(): Promise<{
  state: AuthenticationState;
  saveCreds: () => Promise<void>;
}> {
  const stored = unprotect(await readDocument<EncryptedPayload | DevelopmentPayload>(AUTH_DOCUMENT_KEY));
  const credentials = stored?.creds ? deserialise<AuthenticationState["creds"]>(stored.creds) : initAuthCreds();
  const keys = stored?.keys ? deserialise<Record<string, Record<string, unknown>>>(stored.keys) : {};
  let writes = Promise.resolve();

  const persist = () => {
    const snapshot: StoredAuth = { creds: credentials, keys };
    writes = writes.catch(() => undefined).then(() => writeDocument(AUTH_DOCUMENT_KEY, protect(snapshot)));
    return writes;
  };

  return {
    state: {
      creds: credentials,
      keys: {
        get: async (type, ids) => {
          const result = {} as { [id: string]: SignalDataTypeMap[typeof type] };
          for (const id of ids) {
            let value = keys[type]?.[id];
            if (type === "app-state-sync-key" && value) {
              value = proto.Message.AppStateSyncKeyData.fromObject(value);
            }
            result[id] = value as SignalDataTypeMap[typeof type];
          }
          return result;
        },
        set: async (data) => {
          for (const [category, entries] of Object.entries(data)) {
            keys[category] ??= {};
            for (const [id, value] of Object.entries(entries ?? {})) {
              if (value) keys[category][id] = value;
              else delete keys[category][id];
            }
          }
          await persist();
        },
        clear: async () => {
          for (const category of Object.keys(keys)) delete keys[category];
          await persist();
        },
      },
    },
    saveCreds: persist,
  };
}

export async function clearNeonAuthState() {
  await writeDocument(AUTH_DOCUMENT_KEY, { version: 0, payload: null } satisfies DevelopmentPayload);
}
