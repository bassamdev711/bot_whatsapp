/** Server-only JSON document storage. Neon is used in Vercel; a local file fallback keeps development usable. */
import path from "node:path";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

const connectionCandidates = [process.env.POSTGRES_PRISMA_URL, process.env.DATABASE_URL_UNPOOLED, process.env.DATABASE_URL];
const databaseUrl = connectionCandidates.find((value) => typeof value === "string" && /^postgres(?:ql)?:\/\//i.test(value.trim()))?.trim();
const dataDirectory = path.join(process.cwd(), ".wasla-data");
let schemaReady: Promise<void> | null = null;

function sql() {
  if (!databaseUrl) return null;
  return neon(databaseUrl);
}

async function ensureSchema() {
  const client = sql();
  if (!client) return;
  if (!schemaReady) {
    schemaReady = (async () => {
      await client`CREATE TABLE IF NOT EXISTS wasla_documents (
        document_key TEXT PRIMARY KEY,
        payload JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`;
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  await schemaReady;
}

async function localRead<T>(key: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(path.join(dataDirectory, `${key}.json`), "utf8")) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

async function localWrite<T>(key: string, payload: T) {
  await mkdir(dataDirectory, { recursive: true });
  const target = path.join(dataDirectory, `${key}.json`);
  const temporary = `${target}.tmp`;
  await writeFile(temporary, `${JSON.stringify(payload, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  await rename(temporary, target);
}

export function usingNeon() {
  return Boolean(databaseUrl);
}

export async function storageMode(): Promise<"neon" | "local" | "unavailable"> {
  if (!databaseUrl) return "local";
  try {
    await ensureSchema();
    return "neon";
  } catch {
    return "unavailable";
  }
}

export async function readDocument<T>(key: string): Promise<T | null> {
  const client = sql();
  if (!client) return localRead<T>(key);
  await ensureSchema();
  const rows = await client`SELECT payload FROM wasla_documents WHERE document_key = ${key} LIMIT 1`;
  return (rows[0]?.payload as T | undefined) ?? null;
}

export async function writeDocument<T>(key: string, payload: T) {
  const client = sql();
  if (!client) return localWrite(key, payload);
  await ensureSchema();
  const encoded = JSON.stringify(payload);
  await client`INSERT INTO wasla_documents (document_key, payload, updated_at)
    VALUES (${key}, ${encoded}::jsonb, NOW())
    ON CONFLICT (document_key) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()`;
}
