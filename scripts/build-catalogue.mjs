#!/usr/bin/env node
// PAID catalogue fallback — only for ids scripts/prep-photos.mjs reported
// missing. Skips anything already in public/catalogue. Uses whichever
// provider is set in .env.local (PROVIDER=openai|gemini) — the cheapest
// is OpenAI's gpt-image-1-mini at about Rs 1.60. Stops on the first API
// error instead of burning credit in a loop.
//
//   PROVIDER=openai OPENAI_API_KEY=xxx node scripts/build-catalogue.mjs
//   PROVIDER=gemini GEMINI_API_KEY=xxx node scripts/build-catalogue.mjs

import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { GARMENTS } from "../lib/catalogue.js";
import { PROVIDER, TIER, generateFromText } from "../lib/imagegen.js";

const key = PROVIDER === "gemini" ? process.env.GEMINI_API_KEY : process.env.OPENAI_API_KEY;
if (!key) {
  console.error(
    PROVIDER === "gemini"
      ? "Set GEMINI_API_KEY. Get one at https://aistudio.google.com/apikey"
      : "Set OPENAI_API_KEY. Get one at https://platform.openai.com/api-keys"
  );
  process.exit(1);
}

function buildPrompt(g) {
  const colourway = g.colourways[0].name;
  return `A single ${g.name} — ${g.fabric}, in ${colourway}. Studio product photograph, the complete garment displayed flat and centred against a plain mid-grey seamless background. Even soft lighting, no harsh shadows. The whole garment visible from neckline to hem with a small margin of background on every side. No person, no face, no mannequin head, no props, no text, no watermark. Sharp detail on the weave and the embroidery. Vertical 3:4 frame.`;
}

async function main() {
  const outDir = path.resolve("public/catalogue");
  await mkdir(outDir, { recursive: true });

  const missing = GARMENTS.filter((g) => !existsSync(path.join(outDir, `${g.id}.jpg`)));

  if (missing.length === 0) {
    console.log("Nothing missing — every catalogue image already exists.");
    return;
  }

  console.log(`Provider: ${PROVIDER} (${TIER} tier). Generating ${missing.length} image(s).\n`);

  let total = 0;
  for (const g of missing) {
    // Throws and stops the run on the first error — no burning credit in a loop.
    const { jpeg, costInr } = await generateFromText({ prompt: buildPrompt(g) });
    await writeFile(path.join(outDir, `${g.id}.jpg`), jpeg);
    total += costInr;
    console.log(`✓ ${g.id}  —  running total ₹${total.toFixed(2)}`);
  }

  console.log(`\nDone. ${missing.length} image(s), ₹${total.toFixed(2)} total.`);
}

main().catch((e) => {
  console.error(`\n✗ ${e.message}`);
  process.exit(1);
});
