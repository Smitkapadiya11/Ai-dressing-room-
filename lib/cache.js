// THE CACHE — worth more than every other saving combined while tuning
// the flow. No library, no TTL, no eviction. Delete .data/ when you want
// it cold.
//
// Local dev only: Vercel's serverless functions run on a read-only
// filesystem outside /tmp, so a write here would throw on every single
// request in production. Both functions degrade to a no-op cache miss
// instead of crashing the fitting when the disk isn't writable.

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const DIR = path.resolve(".data/cache");

export function cacheKey({ personBytes, garmentId, colourway, provider, tier }) {
  return createHash("sha256")
    .update(personBytes)
    .update(garmentId)
    .update(colourway || "")
    .update(provider)
    .update(tier)
    .digest("hex");
}

export function readCache(key) {
  try {
    const file = path.join(DIR, `${key}.jpg`);
    return existsSync(file) ? readFileSync(file) : null;
  } catch {
    return null;
  }
}

export function writeCache(key, buffer) {
  try {
    mkdirSync(DIR, { recursive: true });
    writeFileSync(path.join(DIR, `${key}.jpg`), buffer);
  } catch {
    // Read-only filesystem (serverless production) — the fitting still
    // succeeded, it just won't be free on a repeat. Not fatal.
  }
}
