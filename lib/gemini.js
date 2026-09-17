// ============================================================
//  THE ENGINE
//
//  callImage() hides which Gemini request shape is live behind one
//  function — scripts/probe-gemini.mjs tells you which one, you set
//  GEMINI_API_SHAPE ("A" or "B"), and everything above this file never
//  needs to know. Switching later is the one env var, nothing else.
//
//  Text calls (body read, fit check) always use the lite model chain —
//  they are short structured replies, not reasoning, and lite is roughly
//  a third of flash's price. Every call, text and image, asks for
//  thinking_level "minimal": you are not asking anything to reason, and
//  thinking tokens are billed.
// ============================================================

const API_ROOT = "https://generativelanguage.googleapis.com/v1beta";

const IMAGE_MODELS = ["gemini-3.1-flash-image", "gemini-2.5-flash-image"];
const TEXT_MODELS = ["gemini-flash-lite-latest", "gemini-2.5-flash-lite", "gemini-2.5-flash"];

const SHAPE = (process.env.GEMINI_API_SHAPE || "A").toUpperCase();

// RESOLUTION — this one line is ~95% of the running cost.
export const SIZE = process.env.RESULT_SIZE || "1K";
export const COST_INR_BY_SIZE = { "512px": 4.3, "1K": 6.41, "2K": 9.66 };
export const TEXT_COST_INR = 0.1;

export const imageCostInr = () => COST_INR_BY_SIZE[SIZE] ?? COST_INR_BY_SIZE["1K"];

function requireKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("NO_KEY");
  return key;
}

// ---------- data URL <-> parts ----------

export const inlineOf = (dataUrl) => {
  const m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl || "");
  if (!m) throw new Error("Expected a data: URL");
  return { mimeType: m[1], data: m[2] };
};

// ---------- Shape A — classic generateContent ----------

async function callGenerateContentImage(model, parts, { temperature, seed }) {
  const key = requireKey();
  const res = await fetch(`${API_ROOT}/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      contents: [{ role: "user", parts }],
      generationConfig: {
        temperature,
        seed,
        candidateCount: 1,
        responseModalities: ["IMAGE"],
        imageConfig: { imageSize: SIZE, aspectRatio: "9:16" },
        thinking_level: "minimal",
      },
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    const err = new Error(`Gemini ${res.status}: ${text.slice(0, 400)}`);
    err.status = res.status;
    throw err;
  }
  const data = JSON.parse(text);
  const part = data?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  if (!part) throw new Error("Model returned no image");
  return `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
}

// ---------- Shape B — /interactions ----------

async function callInteractionsImage(model, parts, { temperature, seed }) {
  const key = requireKey();
  const input = parts.map((p) =>
    p.text ? { type: "text", text: p.text } : { type: "image", mime_type: p.inlineData.mimeType, data: p.inlineData.data }
  );
  const res = await fetch(`${API_ROOT}/interactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      model,
      input,
      temperature,
      seed,
      thinking_level: "minimal",
      response_format: { type: "image", image_size: SIZE, aspect_ratio: "9:16" },
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    const err = new Error(`Gemini ${res.status}: ${text.slice(0, 400)}`);
    err.status = res.status;
    throw err;
  }
  const data = JSON.parse(text);
  const img = data?.interaction?.output_image;
  if (!img?.data) throw new Error("Model returned no image");
  return `data:${img.mime_type || "image/png"};base64,${img.data}`;
}

// Try the configured model, then the fallbacks, but only on 404/400-model errors.
async function withModelFallback(list, fn) {
  let last;
  for (const model of list) {
    try {
      return { result: await fn(model), model };
    } catch (e) {
      last = e;
      const modelMissing = e.status === 404 || (e.status === 400 && /model/i.test(e.message));
      if (!modelMissing) throw e;
    }
  }
  throw last;
}

// The one function everything else calls. Keep it this small.
export async function callImage(parts, opts = { temperature: 0.15, seed: 42 }) {
  const call = SHAPE === "B" ? callInteractionsImage : callGenerateContentImage;
  const { result, model } = await withModelFallback(IMAGE_MODELS, (m) => call(m, parts, opts));
  return { image: result, model };
}

// ---------- text (lite) ----------

async function callGenerateContentText(model, parts, { temperature, maxOutputTokens }) {
  const key = requireKey();
  const res = await fetch(`${API_ROOT}/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      contents: [{ role: "user", parts }],
      generationConfig: { temperature, maxOutputTokens, thinking_level: "minimal" },
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    const err = new Error(`Gemini ${res.status}: ${text.slice(0, 400)}`);
    err.status = res.status;
    throw err;
  }
  const data = JSON.parse(text);
  return (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text).filter(Boolean).join("\n").trim();
}

export async function callText(parts, opts = { temperature: 0.1, maxOutputTokens: 400 }) {
  const { result, model } = await withModelFallback(TEXT_MODELS, (m) => callGenerateContentText(m, parts, opts));
  return { text: result, model };
}

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
  const { text } = await callText(
    [{ inlineData: inlineOf(personDataUrl) }, { text: BODY_READ_PROMPT }],
    { temperature: 0.1, maxOutputTokens: 400 }
  );
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
  const { image, model } = await callImage(
    [{ inlineData: inlineOf(personDataUrl) }, { inlineData: inlineOf(garmentDataUrl) }, { text: prompt }],
    { temperature: 0.15, seed: 42 }
  );
  return { image, model };
}

// ---------- PASS C — verify (fired after the result is already on screen) ----------

export async function verify({ resultDataUrl, bodyRead }) {
  const { text } = await callText(
    [
      { inlineData: inlineOf(resultDataUrl) },
      {
        text: `Here is a description of a person's build: ${bodyRead}. Does the person in this image match that description? Answer with only a JSON object: {"match": true|false, "drift": "<what differs, or empty>"}`,
      },
    ],
    { temperature: 0, maxOutputTokens: 200 }
  );
  const m = /\{[\s\S]*\}/.exec(text);
  if (!m) return { match: true, drift: "" }; // unparseable -> don't block the customer
  try {
    const p = JSON.parse(m[0]);
    return { match: p.match !== false, drift: String(p.drift || "") };
  } catch {
    return { match: true, drift: "" };
  }
}
