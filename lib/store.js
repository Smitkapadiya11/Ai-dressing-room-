// A tiny in-memory hand-off so the QR code has something to point at.
// Lives for 15 minutes. That is all a customer needs to scan and save.
//
// Honest limitation: on a serverless host this map lives inside one
// instance, so a scan that lands on a cold instance will miss. For a kiosk
// running `next start` on a box in the shop — the real deployment — it is
// exact. If you later want it bulletproof on Vercel, swap the two functions
// below for Vercel Blob or any S3 bucket. Nothing else changes.

const TTL_MS = 15 * 60 * 1000;
const store = globalThis.__kapadiyaLooks || (globalThis.__kapadiyaLooks = new Map());

function sweep() {
  const now = Date.now();
  for (const [k, v] of store) if (now - v.at > TTL_MS) store.delete(k);
}

export function put(image, meta = {}) {
  sweep();
  const id = Math.random().toString(36).slice(2, 10);
  store.set(id, { image, meta, at: Date.now() });
  return id;
}

export function get(id) {
  sweep();
  return store.get(id) || null;
}
