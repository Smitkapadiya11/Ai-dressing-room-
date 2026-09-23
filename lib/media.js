// Asset slots from docs/ASSET_PROMPTS.md. Each slot resolves to a real file
// under public/ if one exists at build time, otherwise null — and the caller
// keeps its code-native fallback. Drop a file at its path and rebuild; no code change.
import fs from "node:fs";
import path from "node:path";

const PUBLIC = path.join(process.cwd(), "public");
const exists = (p) => fs.existsSync(path.join(PUBLIC, p));

export const still = (p) => (exists(p) ? p : null);

// base without extension, e.g. "/media/home/hero-loop"; poster is optional
export function clip(base, poster) {
  const mp4 = exists(`${base}.mp4`) ? `${base}.mp4` : null;
  const webm = exists(`${base}.webm`) ? `${base}.webm` : null;
  if (!mp4 && !webm) return null;
  return { mp4, webm, poster: poster && exists(poster) ? poster : null };
}

const H = "/media/home";
export const MEDIA = {
  hero: clip(`${H}/hero-loop`, `${H}/hero-poster.jpg`),
  heroPortrait: clip(`${H}/hero-loop-portrait`, `${H}/hero-poster.jpg`),
  problem: ["unfolding", "trialroom", "leaving", "stockroom"].map((n) => still(`${H}/problem-${n}.jpg`)),
  origin: ["china", "surat-market", "workbench"].map((n) => still(`${H}/origin-${n}.jpg`)),
  founder: still(`${H}/founder.jpg`),
  steps: [
    clip(`${H}/step-1-scan`, `${H}/step-1-poster.jpg`),
    clip(`${H}/step-2-choose`, `${H}/step-2-poster.jpg`),
    clip(`${H}/step-3-see`, `${H}/step-3-poster.jpg`),
  ],
  // matched to features.live order: catalogue, (instant), QR, wall, attract
  features: [still(`${H}/feature-catalogue.jpg`), null, still(`${H}/feature-qr.jpg`), still(`${H}/feature-wall.jpg`), still(`${H}/feature-attract.jpg`)],
  honesty: { before: still(`${H}/honesty-before.jpg`), after: still(`${H}/honesty-after.jpg`), bg: still(`${H}/honesty-bg.jpg`) },
  product: still(`${H}/mirror-product.png`) || still(`${H}/mirror-product.jpg`),
  benefits: still(`${H}/benefits-showroom.jpg`),
  ctaSilk: clip(`${H}/cta-silk`, `${H}/cta-silk-poster.jpg`),
  grain: still("/media/global/fabric-grain.png"),
};
