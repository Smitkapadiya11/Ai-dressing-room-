// THE CACHE — worth more than every other saving combined while tuning
// the flow. No library, no TTL, no eviction. Delete .data/ when you want
// it cold.

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const DIR = path.resolve(".data/cache");

export function cacheKey({ personBytes, garmentId, colourway, size }) {
  return createHash("sha256")
    .update(personBytes)
    .update(garmentId)
    .update(colourway || "")
    .update(size)
    .digest("hex");
}

export function readCache(key) {
  const file = path.join(DIR, `${key}.jpg`);
  return existsSync(file) ? readFileSync(file) : null;
}

export function writeCache(key, buffer) {
  mkdirSync(DIR, { recursive: true });
  writeFileSync(path.join(DIR, `${key}.jpg`), buffer);
}
