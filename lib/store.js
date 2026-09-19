// The QR hand-off used to be an in-memory Map — fine under `next start`
// in the shop, but wrong most of the time on Vercel: each request can
// land on a different serverless instance with its own empty memory, so
// a phone scanning the QR almost never hits the instance that saved the
// look. Vercel Blob is shared storage, so every instance sees the same
// write. Requires Blob storage enabled on the Vercel project (Storage
// tab -> Create Database -> Blob), which provisions BLOB_READ_WRITE_TOKEN
// automatically.

import { put, list } from "@vercel/blob";

const TTL_MS = 15 * 60 * 1000;

export async function saveLook(image) {
  const m = /^data:([^;]+);base64,(.+)$/.exec(image || "");
  if (!m) throw new Error("Expected a data: URL");
  const expiresAt = Date.now() + TTL_MS;
  // The expiry rides along in the id itself, so a stale link is caught
  // by a string check — no network call needed before we even try.
  const id = `${crypto.randomUUID()}.${expiresAt}`;
  await put(`looks/${id}.jpg`, Buffer.from(m[2], "base64"), {
    access: "public",
    contentType: m[1],
    addRandomSuffix: false,
  });
  return id;
}

export async function getLook(id) {
  const expiresAt = Number(String(id).split(".")[1] || 0);
  if (!expiresAt || Date.now() > expiresAt) return null;

  const { blobs } = await list({ prefix: `looks/${id}.jpg`, limit: 1 });
  const blob = blobs[0];
  if (!blob) return null;

  const res = await fetch(blob.url);
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}
