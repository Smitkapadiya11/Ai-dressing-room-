#!/usr/bin/env node
// FREE catalogue path. Rs 0 if the shop photographs its own stock.
//
//   node scripts/prep-photos.mjs ./raw-photos
//
// Takes a folder of phone photos named <garment-id>.jpg and, for each one,
// centre-crops to 3:4, resizes to 1024 on the long edge, normalises exposure,
// and writes public/catalogue/<id>.jpg at quality 82. Prints which of the 14
// catalogue ids are still missing — hand those to scripts/build-catalogue.mjs.

import { existsSync } from "node:fs";
import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { GARMENTS } from "../lib/catalogue.js";

const HELP = `
Prep the catalogue photos — Rs 0.

  node scripts/prep-photos.mjs <folder-of-photos>

Each photo must be named <garment-id>.jpg (see lib/catalogue.js for the 14
ids). Anything else in the folder is ignored.

Shooting guide — ten minutes, all fourteen garments, Rs 0:
  - Plain light wall, garment hung flat.
  - Whole garment in frame, with a hand's width of wall on every side.
  - Daylight from a window to one side. No flash.
  - Phone held level, at the garment's middle.
  - Portrait orientation.
`;

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log(HELP);
    process.exit(args.length === 0 ? 1 : 0);
  }

  const srcDir = path.resolve(args[0]);
  if (!existsSync(srcDir)) {
    console.error(`No such folder: ${srcDir}`);
    process.exit(1);
  }

  const outDir = path.resolve("public/catalogue");
  await mkdir(outDir, { recursive: true });

  const files = new Set(await readdir(srcDir));
  const missing = [];
  let done = 0;

  for (const g of GARMENTS) {
    const filename = `${g.id}.jpg`;
    if (!files.has(filename)) {
      missing.push(g.id);
      continue;
    }

    const inPath = path.join(srcDir, filename);
    const outPath = path.join(outDir, filename);

    await sharp(inPath)
      .resize(768, 1024, { fit: "cover", position: "centre" }) // 3:4, 1024 on the long edge
      .normalise()
      .jpeg({ quality: 82 })
      .toFile(outPath);

    console.log(`✓ ${g.id}`);
    done++;
  }

  console.log(`\n${done}/${GARMENTS.length} catalogue photos written to public/catalogue/`);
  if (missing.length > 0) {
    console.log(`\nStill missing (${missing.length}):`);
    for (const id of missing) console.log(`  - ${id}.jpg`);
    console.log(
      `\nShoot those, or generate them with:\n  GEMINI_API_KEY=xxx node scripts/build-catalogue.mjs`
    );
  } else {
    console.log("\nAll 14 garments photographed. Nothing to generate.");
  }
}

main();
