// The QR hand-off is in memory, on purpose. A kiosk running `next start`
// in the shop holds this exactly; on serverless it is right most of the
// time but not all — swap these two functions for Vercel Blob or S3 if
// you need it guaranteed. Nothing about a customer is written to disk.

const TTL_MS = 15 * 60 * 1000;
const looks = new Map();

export function saveLook(image) {
  const id = crypto.randomUUID();
  looks.set(id, { image, expiresAt: Date.now() + TTL_MS });
  return id;
}

export function getLook(id) {
  const entry = looks.get(id);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    looks.delete(id);
    return null;
  }
  return entry.image;
}
