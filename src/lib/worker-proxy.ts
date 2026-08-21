/**
 * Wasla worker design: browser requests stop at Vercel; only Vercel forwards
 * session controls to the worker with a server-only shared secret.
 */
import type { PublicSession } from "@/lib/whatsapp";

const workerUrl = process.env.WORKER_URL?.replace(/\/$/, "");
const workerSecret = process.env.WORKER_SHARED_SECRET;

export function hasWorkerConfiguration() {
  return Boolean(workerUrl && workerSecret);
}

async function callWorker<T>(pathname: string, init?: RequestInit) {
  if (!workerUrl || !workerSecret) throw new Error("لم تُضبط بيانات اتصال عامل واتساب بعد.");
  const response = await fetch(`${workerUrl}${pathname}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-wasla-worker-secret": workerSecret,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof body?.error === "string" ? body.error : "تعذر الوصول إلى عامل واتساب.";
    throw new Error(message);
  }
  return body as T;
}

export function getWorkerSession() {
  return callWorker<PublicSession>("/v1/session");
}

export function beginWorkerSession(body: { method: "qr" | "pairing"; phone?: string }) {
  return callWorker<PublicSession>("/v1/session", { method: "POST", body: JSON.stringify(body) });
}

export function resetWorkerSession() {
  return callWorker<PublicSession>("/v1/session/reset", { method: "POST", body: "{}" });
}
