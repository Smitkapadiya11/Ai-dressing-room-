// THE SHARE LINK — everything the phone needs travels inside the link.
//
// History, because it explains the shape: this was an in-memory Map. On
// Vercel each request can land on a different serverless instance with
// its own empty memory, so a phone scanning the QR almost never reached
// the instance that had saved the look — it showed "expired" on the very
// first scan, every time.
//
// The look now goes to Vercel Blob (shared across instances, CDN-backed),
// and the blob's URL and expiry are encoded into the share id itself. So
// reading a look back involves no lookup, no shared state and no second
// hop through us: the phone loads the image straight off the CDN. There
// is no instance that can "miss" it.

import { put } from "@vercel/blob";

const TTL_MS = 15 * 60 * 1000;

// A share id may only ever point back at our own blob store. Without this,
// /look/<id> would happily render any image URL someone chose to encode.
const BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";

export async function saveLook(image) {
  const m = /^data:([^;]+);base64,(.+)$/.exec(image || "");
  if (!m) throw new Error("Expected a data: URL");

  const { url } = await put(`looks/${crypto.randomUUID()}.jpg`, Buffer.from(m[2], "base64"), {
    access: "public",
    contentType: m[1],
    addRandomSuffix: false,
  });

  const expiresAt = Date.now() + TTL_MS;
  return Buffer.from(`${expiresAt}|${url}`, "utf8").toString("base64url");
}

// The blob URL to render, or null if the link is expired, malformed, or
// points anywhere other than our own store. Pure string work — an expired
// link costs nothing to reject.
export function readLook(id) {
  const decoded = Buffer.from(String(id || ""), "base64url").toString("utf8");

  const sep = decoded.indexOf("|");
  if (sep < 1) return null;

  const expiresAt = Number(decoded.slice(0, sep));
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return null;

  const url = decoded.slice(sep + 1);
  try {
    if (!new URL(url).host.endsWith(BLOB_HOST_SUFFIX)) return null;
  } catch {
    return null;
  }
  return url;
}
