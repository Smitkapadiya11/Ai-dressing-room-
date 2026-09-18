// THE ENGINE — the prompts and the orchestration. Provider-agnostic:
// every call here goes through lib/imagegen.js, which is the only file
// that knows whether PROVIDER is "openai" or "gemini".

import { TEXT_COST_INR, analyze, generate } from "./imagegen";

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

function colourwayLine(garment, colourway) {
  const isDefault = !colourway || colourway.name === garment.colourways[0].name;
  if (isDefault) return "";
  return `\nRender the garment in ${colourway.name}, approximately ${colourway.hex}. Keep the weave, the embroidery and the border pattern exactly as they are in IMAGE 2 — only the colour of the fabric changes.`;
}

function sareeLine(garment) {
  if (garment.category !== "saree") return "";
  return `\nThis is a saree. The pallu must fall over the LEFT shoulder and hang behind, the pleats must be at the front centre gathered at the waist, and the border must run continuously along the full length of the fabric with no break in the pattern.`;
}

function buildGeneratePrompt({ garment, bodyRead, colourway }) {
  const anchor = bodyRead
    ? `\n\nThe person in IMAGE 1 has this exact physical structure, confirmed:\n${bodyRead}\n\nThe person in your output must match this description in every particular. This is a measurement, not a suggestion.`
    : "";

  return `You are performing a virtual garment fitting.

IMAGE 1 is a photograph of a real person.
IMAGE 2 is a garment.

Produce IMAGE 1 again, unchanged in every way, except that the person is now wearing the garment from IMAGE 2.
${anchor}

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
${colourwayLine(garment, colourway)}
${sareeLine(garment)}

The garment must drape over the body that is actually in IMAGE 1. If the person is broader than a model, the garment is wider on them. If the person is shorter, the garment is shorter. Fabric follows this body, not an ideal one.

Render it as a photograph taken in the same room with the same camera: matched white balance, matched grain, and a contact shadow where the fabric meets the floor. Output the full photograph at the same framing and aspect ratio as IMAGE 1.`;
}

// NO MAKEUP INSTRUCTION, ever — every word aimed at the face raises the
// chance a different face comes back, and that is the one failure a
// person notices instantly. The flattering result is the lighting
// sentence above, not a face instruction.
export async function generateTryOn({ personDataUrl, garmentDataUrl, garment, bodyRead, colourway }) {
  const prompt = buildGeneratePrompt({ garment, bodyRead, colourway });
  const { jpeg, costInr } = await generate({
    personJpeg: jpegOf(personDataUrl),
    garmentJpeg: jpegOf(garmentDataUrl),
    prompt,
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
