/**
 * Wasla worker design: one Node.js process owns the live WhatsApp socket while
 * all rules, events and encrypted credentials remain in Neon.
 */
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { timingSafeEqual } from "node:crypto";
import { beginSession, closeSession, getSession, restoreSession } from "../src/lib/whatsapp";

const port = Number.parseInt(process.env.PORT ?? "3001", 10);
const sharedSecret = process.env.WORKER_SHARED_SECRET;

if (!sharedSecret && process.env.NODE_ENV === "production") {
  throw new Error("WORKER_SHARED_SECRET مطلوب قبل تشغيل عامل واتساب في الإنتاج.");
}

function send(response: ServerResponse, status: number, payload: unknown) {
  const body = JSON.stringify(payload ?? {});
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(body),
  });
  response.end(body);
}

function authorised(request: IncomingMessage) {
  if (!sharedSecret) return process.env.NODE_ENV !== "production";
  const received = request.headers["x-wasla-worker-secret"];
  if (typeof received !== "string") return false;
  const expected = Buffer.from(sharedSecret);
  const candidate = Buffer.from(received);
  return expected.length === candidate.length && timingSafeEqual(expected, candidate);
}

async function readJson(request: IncomingMessage) {
  const parts: Buffer[] = [];
  for await (const part of request) parts.push(Buffer.isBuffer(part) ? part : Buffer.from(part));
  const source = Buffer.concat(parts).toString("utf8").trim();
  return source ? JSON.parse(source) as unknown : {};
}

const server = createServer(async (request, response) => {
  const method = request.method ?? "GET";
  const pathname = new URL(request.url ?? "/", "http://worker.local").pathname;

  if (method === "GET" && pathname === "/health") {
    const session = getSession();
    return send(response, 200, { ok: true, service: "wasla-worker", status: session.status, updatedAt: session.updatedAt });
  }

  if (!authorised(request)) return send(response, 401, { error: "طلب العامل غير مصرح به." });

  try {
    if (method === "GET" && pathname === "/v1/session") return send(response, 200, getSession());
    if (method === "POST" && pathname === "/v1/session") {
      const body = await readJson(request) as { method?: "qr" | "pairing"; phone?: string };
      const sessionMethod = body.method ?? "qr";
      if (sessionMethod !== "qr" && sessionMethod !== "pairing") return send(response, 400, { error: "طريقة الربط غير صالحة." });
      return send(response, 202, await beginSession(sessionMethod, body.phone));
    }
    if (method === "POST" && pathname === "/v1/session/reset") return send(response, 200, await closeSession());
    return send(response, 404, { error: "المسار المطلوب غير موجود." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "تعذر تنفيذ طلب عامل واتساب.";
    return send(response, 500, { error: message });
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Wasla worker listening on port ${port}`);
  void restoreSession().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "تعذر استعادة جلسة واتساب.";
    console.error(message);
  });
});
