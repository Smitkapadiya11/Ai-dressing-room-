// THE ENGINE — the prompts and the orchestration. Provider-agnostic:
// every call here goes through lib/imagegen.js, which is the only file
// that knows whether PROVIDER is "openai" or "gemini".

import { TEXT_COST_INR, analyze, generate } from "./imagegen";
import { buildTryOnPrompt } from "./tryon/prompt";

export { TEXT_COST_INR };

export const inlineOf = (dataUrl) => {
  const m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl || "");
  if (!m) throw new Error("Expected a data: URL");
  return { mimeType: m[1], data: m[2] };
};

const jpegOf = (dataUrl) => Buffer.from(inlineOf(dataUrl).data, "base64");

// ---------- PASS A — the body read ----------

const BODY_READ_PROMPT = `Describe this person's physical structure for a tailor, factually and without flattery. Give exactly these, one per line:
- Height impression (short / average / tall) and head-to-body ratio
- Shoulder width relative to hips
- Build (slim / average / full / broad)
- Torso length relative to legs
- Arm thickness
- Exact posture and stance
- Skin tone in plain words
- Which way the body is turned relative to the camera
- Best-fitting size from S, M, L, XL, XXL
- Three garment colours that would suit this skin tone, named plainly
No opinions, no compliments, no guesses about age or weight in kg.`;

export async function readBody(personDataUrl) {
  const { text } = await analyze({
    jpeg: jpegOf(personDataUrl),
    prompt: BODY_READ_PROMPT,
    temperature: 0.1,
    maxOutputTokens: 400,
  });
  return text;
}

// Free — parses the two lines readBody already paid for. No API call.
export function parseBodyRead(bodyRead) {
  if (!bodyRead) return { recommendedSize: null, suggestedColours: [] };
  const lines = bodyRead
    .split("\n")
    .map((l) => l.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);
  const sizeLine = lines[lines.length - 2] || "";
  const colourLine = lines[lines.length - 1] || "";
  const sizeMatch = sizeLine.match(/\b(XXL|XL|S|M|L)\b/);
  const suggestedColours = colourLine
    .replace(/^[^:]*:/, "")
    .split(/,| and /i)
    .map((c) => c.trim())
    .filter(Boolean);
  return { recommendedSize: sizeMatch ? sizeMatch[1] : null, suggestedColours };
}

// ---------- PASS B — generate ----------

// The prompt lives in lib/tryon/prompt.js — one constant for every provider.
export async function generateTryOn({ personDataUrl, garmentDataUrl, garment, bodyRead, colourway, engine }) {
  const prompt = buildTryOnPrompt({ garment, bodyRead, colourway });
  const { jpeg, costInr } = await generate({
    personJpeg: jpegOf(personDataUrl),
    garmentJpeg: jpegOf(garmentDataUrl),
    prompt,
    engine,
  });
  return { image: `data:image/jpeg;base64,${jpeg.toString("base64")}`, costInr };
}

// ---------- PASS C — verify (fired after the result is already on screen) ----------

export async function verify({ resultDataUrl, bodyRead }) {
  const { text } = await analyze({
    jpeg: jpegOf(resultDataUrl),
    prompt: `Here is a description of a person's build: ${bodyRead}. Does the person in this image match that description? Answer with only a JSON object: {"match": true|false, "drift": "<what differs, or empty>"}`,
    temperature: 0,
    maxOutputTokens: 200,
  });
  const m = /\{[\s\S]*\}/.exec(text);
  if (!m) return { match: true, drift: "" }; // unparseable -> don't block the customer
  try {
    const p = JSON.parse(m[0]);
    return { match: p.match !== false, drift: String(p.drift || "") };
  } catch {
    return { match: true, drift: "" };
  }
}
