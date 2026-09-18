#!/usr/bin/env node
// Google has two image-generation request shapes live right now, and the
// wrong one fails quietly. Run this ONCE (it costs about Rs 6, one real
// generation) and build against whichever shape answers.
//
//   GEMINI_API_KEY=xxx node scripts/probe-gemini.mjs
//
// Whichever shape wins, set GEMINI_API_SHAPE=A or GEMINI_API_SHAPE=B in
// .env.local — lib/providers/gemini.js reads that one line and nothing
// else about the app needs to change. Only relevant when PROVIDER=gemini;
// skip this if you're running on OpenAI.

import { readFileSync } from "node:fs";
import path from "node:path";

const key = process.env.GEMINI_API_KEY;
if (!key) {
  console.error("Set GEMINI_API_KEY. Get one at https://aistudio.google.com/apikey");
  process.exit(1);
}

const MODEL = "gemini-3.1-flash-image";

// Any two real photographs prove the shape works; the boutique shot
// doubles as both "person" and "garment" here — content doesn't matter,
// only whether the request is accepted and an image comes back.
const sample = readFileSync(path.resolve("public/brand/boutique.jpg"));
const b64 = sample.toString("base64");
const inlineA = { inlineData: { mimeType: "image/jpeg", data: b64 } };
const inlineB = { type: "image", mime_type: "image/jpeg", data: b64 };
const PROMPT = "Combine these two reference photographs into one image. This is a protocol probe — the content does not matter.";

async function probeShapeA() {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [inlineA, inlineA, { text: PROMPT }] }],
        generationConfig: {
          temperature: 0.15,
          responseModalities: ["IMAGE"],
          imageConfig: { imageSize: "1K", aspectRatio: "9:16" },
        },
      }),
    }
  );
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status}: ${text.slice(0, 300)}`);
  const data = JSON.parse(text);
  const ok = Boolean(data?.candidates?.[0]?.content?.parts?.some((p) => p.inlineData?.data));
  if (!ok) throw new Error("200 OK but no image in candidates[0].content.parts[].inlineData.data");
  return true;
}

async function probeShapeB() {
  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      model: MODEL,
      input: [{ type: "text", text: PROMPT }, inlineB, inlineB],
      response_format: { type: "image", image_size: "1K", aspect_ratio: "9:16" },
    }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status}: ${text.slice(0, 300)}`);
  const data = JSON.parse(text);
  const ok = Boolean(data?.interaction?.output_image?.data);
  if (!ok) throw new Error("200 OK but no image at interaction.output_image.data");
  return true;
}

async function main() {
  console.log(`Probing ${MODEL} — this spends about Rs 6.\n`);

  console.log("Shape A (generateContent) ...");
  try {
    await probeShapeA();
    console.log("✓ Shape A works. Set GEMINI_API_SHAPE=A (also the default — you can leave it unset).");
    return;
  } catch (e) {
    console.log(`✗ Shape A failed: ${e.message}`);
  }

  console.log("\nShape B (/interactions) ...");
  try {
    await probeShapeB();
    console.log("✓ Shape B works. Set GEMINI_API_SHAPE=B in .env.local.");
    return;
  } catch (e) {
    console.log(`✗ Shape B failed: ${e.message}`);
  }

  console.error("\nNeither shape answered. Check the key, the model name, and your billing status.");
  process.exit(1);
}

main();
