// THE CACHE — the same photo through the same garment should cost nothing
// the second time. That is not a micro-optimisation while you are paying
// per generated image, and it is also the only thing standing between a
// demo and dead shop wifi.
//
// Two backends, chosen by where this is running:
//   - locally, .data/cache on disk
//   - on Vercel, Blob — because the serverless filesystem is read-only
//     outside /tmp AND per-instance, so a disk cache there is silently
//     always a miss and every repeat gets billed again.
//
// Every path degrades to a plain cache miss rather than throwing: a cache
// that is down must never take a fitting down with it.

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { list, put } from "@vercel/blob";
import { PROMPT_VERSION } from "./tryon/prompt";

const DIR = path.resolve(".data/cache");

const useBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

export function cacheKey({ personBytes, garmentId, colourway, provider, tier }) {
  return createHash("sha256")
    .update(personBytes)
    .update(garmentId)
    .update(colourway || "")
    .update(provider)
    .update(tier)
    .update(PROMPT_VERSION)
    .digest("hex");
}

export async function readCache(key) {
  if (useBlob()) {
    try {
      const { blobs } = await list({ prefix: `cache/${key}.jpg`, limit: 1 });
      if (!blobs[0]) return null;
      const res = await fetch(blobs[0].url);
      if (!res.ok) return null;
      return Buffer.from(await res.arrayBuffer());
    } catch {
      return null;
    }
  }

  try {
    const file = path.join(DIR, `${key}.jpg`);
    return existsSync(file) ? readFileSync(file) : null;
  } catch {
    return null;
  }
}

export async function writeCache(key, buffer) {
  if (useBlob()) {
    try {
      await put(`cache/${key}.jpg`, buffer, {
        access: "public",
        contentType: "image/jpeg",
        addRandomSuffix: false,
        // Two fittings racing on one key would otherwise throw on the
        // second write. The bytes are identical either way.
        allowOverwrite: true,
      });
    } catch {
      // The fitting already succeeded — it just won't be free on a repeat.
    }
    return;
  }

  try {
    mkdirSync(DIR, { recursive: true });
    writeFileSync(path.join(DIR, `${key}.jpg`), buffer);
  } catch {
    // Read-only filesystem. Not fatal, see above.
  }
}
