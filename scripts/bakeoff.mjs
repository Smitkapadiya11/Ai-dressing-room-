#!/usr/bin/env node
// THE BAKEOFF — about Rs 12, ten minutes. Runs one photo of a real
// person and one garment photo through BOTH providers at demo quality
// and writes them side by side. Not a benchmark, not a blog post —
// Smit looks at his own face and picks. Whichever wins becomes
// PROVIDER in .env.local.
//
//   OPENAI_API_KEY=xxx GEMINI_API_KEY=yyy \
//     node scripts/bakeoff.mjs ./me.jpg ./public/catalogue/silk-bandhgala.jpg

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import * as openai from "../lib/providers/openai.js";
import * as gemini from "../lib/providers/gemini.js";
import * as qwen from "../lib/providers/qwen.js";

const HELP = `
The bakeoff — run one photo through both providers, look at your own face.

  node scripts/bakeoff.mjs <person.jpg> <garment.jpg>

Needs OPENAI_API_KEY and/or GEMINI_API_KEY set — it runs whichever of the
two it has a key for, so you can also use this to test just one provider.
Writes bakeoff/openai.jpg and bakeoff/gemini.jpg (gitignored).
`;

const [personPath, garmentPath] = process.argv.slice(2);
if (!personPath || !garmentPath || process.argv.includes("--help")) {
  console.log(HELP);
  process.exit(personPath && garmentPath ? 0 : 1);
}

const PROMPT = `You are performing a virtual garment fitting.

IMAGE 1 is a photograph of a real person.
IMAGE 2 is a garment.

Produce IMAGE 1 again, unchanged in every way, except that the person is now wearing the garment from IMAGE 2.

ABSOLUTELY MUST NOT CHANGE — treat IMAGE 1 as a locked photograph:
- Face, every feature, expression, and skin tone
- Body width, shoulder width, waist, hips, arm thickness, height
- Weight and build. Do not slim, lengthen, or idealise the person
- Pose, stance, and where the hands and feet are
- Hair
- The background, the floor, and the lighting direction

MUST MATCH IMAGE 2 EXACTLY:
- Fabric colour, exact shade
- Print, pattern, motifs, and their scale relative to the body
- Border design, zari work, embroidery placement
- Neckline shape, sleeve length, overall garment length

Render it as a photograph taken in the same room with the same camera: matched white balance, matched grain, and a contact shadow where the fabric meets the floor. Output the full photograph at the same framing and aspect ratio as IMAGE 1.`;

const personJpeg = readFileSync(path.resolve(personPath));
const garmentJpeg = readFileSync(path.resolve(garmentPath));

const outDir = path.resolve("bakeoff");
mkdirSync(outDir, { recursive: true });

async function run(name, adapter, hasKey) {
  if (!hasKey) {
    console.log(`- ${name}: no key set, skipped`);
    return;
  }
  const t0 = Date.now();
  try {
    const { jpeg, costInr } = await adapter.generateImage({ personJpeg, garmentJpeg, prompt: PROMPT, tier: "demo" });
    writeFileSync(path.join(outDir, `${name}.jpg`), jpeg);
    console.log(`✓ ${name}  ${((Date.now() - t0) / 1000).toFixed(1)}s  ₹${costInr.toFixed(2)}  -> bakeoff/${name}.jpg`);
  } catch (e) {
    console.log(`✗ ${name} failed: ${e.message}`);
  }
}

async function main() {
  console.log("Running the bakeoff at demo quality. About Rs 12, ten minutes.\n");
  await Promise.all([
    run("openai", openai, Boolean(process.env.OPENAI_API_KEY)),
    run("gemini", gemini, Boolean(process.env.GEMINI_API_KEY)),
    run("qwen", qwen, Boolean(process.env.QWEN_API_URL || true)),
  ]);
  console.log(
    "\nLook at bakeoff/*.jpg yourself — your own face settles it better than any published benchmark. Set PROVIDER to whichever wins in .env.local."
  );
}

main();
