#!/usr/bin/env node
// PAID catalogue fallback — only for ids scripts/prep-photos.mjs reported
// missing. Skips anything already in public/catalogue. Rs 6.41 per image,
// so fourteen is Rs 90 and four is Rs 26. Stops on the first API error
// instead of burning credit in a loop.
//
//   GEMINI_API_KEY=xxx node scripts/build-catalogue.mjs

import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { GARMENTS } from "../lib/catalogue.js";

const API_ROOT = "https://generativelanguage.googleapis.com/v1beta/models";
const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image";
const RS_PER_IMAGE = 6.41;

const key = process.env.GEMINI_API_KEY;
if (!key) {
  console.error("Set GEMINI_API_KEY. Get one at https://aistudio.google.com/apikey");
  process.exit(1);
}

function buildPrompt(g) {
  const colourway = g.colourways[0].name;
  return `A single ${g.name} — ${g.fabric}, in ${colourway}. Studio product photograph, the complete garment displayed flat and centred against a plain mid-grey seamless background. Even soft lighting, no harsh shadows. The whole garment visible from neckline to hem with a small margin of background on every side. No person, no face, no mannequin head, no props, no text, no watermark. Sharp detail on the weave and the embroidery. Vertical 3:4 frame.`;
}

async function generate(g) {
  const res = await fetch(`${API_ROOT}/${IMAGE_MODEL}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: buildPrompt(g) }] }],
      generationConfig: {
        responseModalities: ["IMAGE"],
        imageConfig: { aspectRatio: "3:4", imageSize: "1K" },
      },
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Gemini ${res.status} on ${g.id}: ${text.slice(0, 400)}`);
  }

  const data = JSON.parse(text);
  const part = data?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  if (!part) throw new Error(`No image returned for ${g.id}`);
  return Buffer.from(part.inlineData.data, "base64");
}

async function main() {
  const outDir = path.resolve("public/catalogue");
  await mkdir(outDir, { recursive: true });

  const missing = GARMENTS.filter((g) => !existsSync(path.join(outDir, `${g.id}.jpg`)));

  if (missing.length === 0) {
    console.log("Nothing missing — every catalogue image already exists.");
    return;
  }

  console.log(`Generating ${missing.length} image(s) at ~Rs ${RS_PER_IMAGE.toFixed(2)} each.\n`);

  let total = 0;
  for (const g of missing) {
    const jpg = await generate(g); // throws and stops the run on the first error
    await writeFile(path.join(outDir, `${g.id}.jpg`), jpg);
    total += RS_PER_IMAGE;
    console.log(`✓ ${g.id}  —  running total ₹${total.toFixed(2)}`);
  }

  console.log(`\nDone. ${missing.length} image(s), ₹${total.toFixed(2)} total.`);
}

main().catch((e) => {
  console.error(`\n✗ ${e.message}`);
  process.exit(1);
});
