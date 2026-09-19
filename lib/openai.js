// ============================================================
//  THE ENGINE — OPENAI BACKEND
//
//  Same contract as lib/gemini.js (hasKey, mode, tryOn,
//  estimateCost) so app/api/tryon/route.js can talk to either
//  provider through lib/ai.js without knowing which one is live.
//
//  Text passes (read the body / verify) go through Chat
//  Completions with vision. The fitting itself goes through
//  /v1/images/edits with gpt-image-1, handing it both the
//  person photo and the garment photo as input images.
// ============================================================

const CHAT_URL = "https://api.openai.com/v1/chat/completions";
const EDIT_URL = "https://api.openai.com/v1/images/edits";

const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";
const TEXT_MODEL = process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini";
const IMAGE_SIZE = process.env.OPENAI_IMAGE_SIZE || "1024x1024";
const IMAGE_QUALITY = process.env.OPENAI_IMAGE_QUALITY || "medium";

export const hasKey = () => Boolean(process.env.OPENAI_API_KEY);
export const mode = () => (process.env.TRYON_MODE || "premium").toLowerCase();

// ---------- low level ----------

function authHeader() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("NO_KEY");
  return `Bearer ${key}`;
}

async function callChat(body, { timeoutMs = 30_000 } = {}) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(CHAT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authHeader() },
      body: JSON.stringify(body),
      signal: ctl.signal,
    });
    const text = await res.text();
    if (!res.ok) {
      const err = new Error(`OpenAI ${res.status}: ${text.slice(0, 400)}`);
      err.status = res.status;
      throw err;
    }
    return JSON.parse(text);
  } finally {
    clearTimeout(timer);
  }
}

async function callEdit(form, { timeoutMs = 90_000 } = {}) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(EDIT_URL, {
      method: "POST",
      headers: { Authorization: authHeader() },
      body: form,
      signal: ctl.signal,
    });
    const text = await res.text();
    if (!res.ok) {
      const err = new Error(`OpenAI ${res.status}: ${text.slice(0, 400)}`);
      err.status = res.status;
      throw err;
    }
    return JSON.parse(text);
  } finally {
    clearTimeout(timer);
  }
}

function dataUrlToBlob(dataUrl) {
  const m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl || "");
  if (!m) throw new Error("Expected a data: URL");
  return new Blob([Buffer.from(m[2], "base64")], { type: m[1] });
}

const textOf = (d) => d?.choices?.[0]?.message?.content?.trim() || "";
const imageOf = (d) => {
  const b64 = d?.data?.[0]?.b64_json;
  return b64 ? `data:image/png;base64,${b64}` : null;
};

// ---------- PASS A — read the body ----------

const BODY_READ_PROMPT = `Describe this person's physical structure for a tailor, factually and without flattery. Give exactly these, one per line:
- Height impression (short / average / tall) and head-to-body ratio
- Shoulder width relative to hips
- Build (slim / average / full / broad)
- Torso length relative to legs
- Arm thickness
- Exact posture and stance
- Skin tone in plain words
- Which way the body is turned relative to the camera
No opinions, no compliments, no guesses about age or weight in kg.`;

export async function readBody(personDataUrl) {
  const data = await callChat(
    {
      model: TEXT_MODEL,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: BODY_READ_PROMPT },
            { type: "image_url", image_url: { url: personDataUrl } },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 400,
    },
    { timeoutMs: 30_000 }
  );
  return textOf(data);
}

// ---------- PASS B — generate ----------

function sareeClause(kind) {
  if (kind !== "saree") return "";
  return `
This is a saree. The pallu must fall over the LEFT shoulder and hang behind, the pleats must be at the front centre gathered at the waist, and the border must run continuously along the full length of the fabric with no break in the pattern.`;
}

function buildPrompt({ garment, bodyRead }) {
  const anchor = bodyRead
    ? `
The person in the first image has this exact physical structure, confirmed:
${bodyRead}

Your output must match this description in every particular. This is a measurement, not a suggestion.
`
    : "";

  return `You are performing a virtual garment fitting.

The first image is a photograph of a real person. The second image is a garment.

Edit the first image so the person is wearing the garment from the second image. Everything else about the first image stays as it is.
${anchor}
ABSOLUTELY MUST NOT CHANGE — treat the first image as a locked photograph:
- Face, every feature, expression, and skin tone
- Body width, shoulder width, waist, hips, arm thickness, height
- Weight and build. Do not slim, lengthen, or idealise the person
- Pose, stance, and where the hands and feet are
- Hair
- The background, the floor, and the lighting direction

MUST MATCH THE SECOND IMAGE EXACTLY:
- Fabric colour, exact shade
- Print, pattern, motifs, and their scale relative to the body
- Border design, zari work, embroidery placement
- Neckline shape, sleeve length, overall garment length
${sareeClause(garment?.kind)}
The garment must drape over the body that is actually in the first image. If the person is broader than a model, the garment is wider on them. If the person is shorter, the garment is shorter. Fabric follows this body, not an ideal one.`;
}

export async function generateTryOn({ personDataUrl, garmentDataUrl, garment, bodyRead, extra }) {
  const prompt = buildPrompt({ garment, bodyRead }) + (extra ? `\n\nAlso correct this: ${extra}` : "");

  const form = new FormData();
  form.append("model", IMAGE_MODEL);
  form.append("prompt", prompt);
  form.append("image[]", dataUrlToBlob(personDataUrl), "person.png");
  form.append("image[]", dataUrlToBlob(garmentDataUrl), "garment.png");
  form.append("size", IMAGE_SIZE);
  form.append("quality", IMAGE_QUALITY);
  form.append("n", "1");

  const data = await callEdit(form);
  const img = imageOf(data);
  if (!img) throw new Error("Model returned no image");
  return { image: img, model: IMAGE_MODEL };
}

// ---------- PASS C — verify ----------

export async function verify({ resultDataUrl, bodyRead }) {
  const data = await callChat(
    {
      model: TEXT_MODEL,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Here is a description of a person's build:
${bodyRead}

Does the person in this image match that description? Answer with only a JSON object: {"match": true|false, "drift": "<what differs, or empty>"}`,
            },
            { type: "image_url", image_url: { url: resultDataUrl } },
          ],
        },
      ],
      temperature: 0,
      max_tokens: 200,
    },
    { timeoutMs: 25_000 }
  );
  const raw = textOf(data);
  const m = /\{[\s\S]*\}/.exec(raw);
  if (!m) return { match: true, drift: "" }; // unparseable -> don't block the customer
  try {
    const p = JSON.parse(m[0]);
    return { match: p.match !== false, drift: String(p.drift || "") };
  } catch {
    return { match: true, drift: "" };
  }
}

// ---------- the orchestrator ----------

export async function tryOn({ personDataUrl, garmentDataUrl, garment, cachedBodyRead }) {
  const t0 = Date.now();
  const steps = [];
  const premium = mode() === "premium";

  let bodyRead = cachedBodyRead || null;
  if (premium && !bodyRead) {
    const a = Date.now();
    try {
      bodyRead = await readBody(personDataUrl);
      steps.push({ pass: "read", ms: Date.now() - a });
    } catch (e) {
      steps.push({ pass: "read", ms: Date.now() - a, error: e.message });
      bodyRead = null;
    }
  }

  const b = Date.now();
  let { image, model } = await generateTryOn({ personDataUrl, garmentDataUrl, garment, bodyRead });
  steps.push({ pass: "generate", ms: Date.now() - b, model });

  let checked = null;
  if (premium && bodyRead) {
    const c = Date.now();
    try {
      checked = await verify({ resultDataUrl: image, bodyRead });
      steps.push({ pass: "verify", ms: Date.now() - c, match: checked.match });
    } catch (e) {
      steps.push({ pass: "verify", ms: Date.now() - c, error: e.message });
    }

    if (checked && !checked.match && checked.drift) {
      const d = Date.now();
      try {
        const again = await generateTryOn({
          personDataUrl, garmentDataUrl, garment, bodyRead, extra: checked.drift,
        });
        image = again.image;
        steps.push({ pass: "retry", ms: Date.now() - d, reason: checked.drift.slice(0, 120) });
      } catch (e) {
        steps.push({ pass: "retry", ms: Date.now() - d, error: e.message });
      }
    }
  }

  return {
    image,
    bodyRead,
    verified: checked ? checked.match : null,
    steps,
    totalMs: Date.now() - t0,
    mode: premium ? "premium" : "simple",
  };
}

// Rough cost in rupees, for the owner-side counter. Published gpt-image-1
// and gpt-4o-mini pricing, 1 USD = 95.60 INR. Adjust PRICES if OpenAI's
// rates change or if OPENAI_IMAGE_QUALITY/OPENAI_IMAGE_SIZE differ from
// the defaults this estimate assumes (medium quality, 1024x1024).
const INR = 95.6;
const PRICE_USD = { image: 0.07, text: 0.001 };
export function estimateCost(steps) {
  let usd = 0;
  for (const s of steps) {
    if (s.error) continue;
    usd += s.pass === "generate" || s.pass === "retry" ? PRICE_USD.image : PRICE_USD.text;
  }
  return Math.round(usd * INR * 100) / 100;
}
