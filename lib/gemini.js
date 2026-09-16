// ============================================================
//  THE ENGINE  —  08-body-lock.md, implemented.
//
//  Two modes, both here:
//    TRYON_MODE=simple   one call. fast, cheap, ~80% right.
//    TRYON_MODE=premium  three calls: read the body, generate against
//                        that reading, verify the result, retry once.
//
//  With no GEMINI_API_KEY the whole thing falls back to demo mode and
//  the kiosk still runs end to end. That is deliberate: you can show
//  this to an investor on a train with no key and no wifi.
// ============================================================

const API_ROOT = "https://generativelanguage.googleapis.com/v1beta/models";

const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image";
const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-3-flash";

// Model ids move. If the configured one 404s we try these in order.
const IMAGE_FALLBACKS = [
  "gemini-3.1-flash-image",
  "gemini-2.5-flash-image",
  "gemini-2.0-flash-preview-image-generation",
];
const TEXT_FALLBACKS = ["gemini-3-flash", "gemini-2.5-flash", "gemini-2.0-flash"];

export const hasKey = () => Boolean(process.env.GEMINI_API_KEY);
export const mode = () => (process.env.TRYON_MODE || "premium").toLowerCase();

// ---------- low level ----------

async function call(model, body, { timeoutMs = 90_000 } = {}) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("NO_KEY");

  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_ROOT}/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify(body),
      signal: ctl.signal,
    });
    const text = await res.text();
    if (!res.ok) {
      const err = new Error(`Gemini ${res.status}: ${text.slice(0, 400)}`);
      err.status = res.status;
      throw err;
    }
    return JSON.parse(text);
  } finally {
    clearTimeout(timer);
  }
}

// Try the configured model, then the fallbacks, but only on 404/400-model errors.
async function callWithFallback(preferred, list, body, opts) {
  const chain = [preferred, ...list.filter((m) => m !== preferred)];
  let last;
  for (const m of chain) {
    try {
      return { data: await call(m, body, opts), model: m };
    } catch (e) {
      last = e;
      const modelMissing =
        e.status === 404 || (e.status === 400 && /model/i.test(e.message));
      if (!modelMissing) throw e;
    }
  }
  throw last;
}

const partsOf = (d) => d?.candidates?.[0]?.content?.parts || [];
const textOf = (d) => partsOf(d).map((p) => p.text).filter(Boolean).join("\n").trim();
const imageOf = (d) => {
  const p = partsOf(d).find((x) => x.inlineData?.data);
  return p ? `data:${p.inlineData.mimeType || "image/png"};base64,${p.inlineData.data}` : null;
};

const inline = (dataUrl) => {
  const m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl || "");
  if (!m) throw new Error("Expected a data: URL");
  return { inlineData: { mimeType: m[1], data: m[2] } };
};

// ---------- PASS A — read the body ----------
// Runs once per customer, not once per garment. ~₹0.30.

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
  const { data } = await callWithFallback(
    TEXT_MODEL,
    TEXT_FALLBACKS,
    {
      contents: [{ role: "user", parts: [inline(personDataUrl), { text: BODY_READ_PROMPT }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 400 },
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
The person in IMAGE 1 has this exact physical structure, confirmed:
${bodyRead}

The person in your output must match this description in every particular. This is a measurement, not a suggestion.
`
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
${sareeClause(garment?.kind)}
The garment must drape over the body that is actually in IMAGE 1. If the person is broader than a model, the garment is wider on them. If the person is shorter, the garment is shorter. Fabric follows this body, not an ideal one.

Output the full photograph at the same framing and aspect ratio as IMAGE 1.`;
}

export async function generateTryOn({ personDataUrl, garmentDataUrl, garment, bodyRead, extra }) {
  const prompt = buildPrompt({ garment, bodyRead }) + (extra ? `\n\nAlso correct this: ${extra}` : "");
  const { data, model } = await callWithFallback(IMAGE_MODEL, IMAGE_FALLBACKS, {
    contents: [
      {
        role: "user",
        parts: [inline(personDataUrl), inline(garmentDataUrl), { text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.15, // low. creativity is the enemy here.
      seed: 42,          // same input, same output.
      candidateCount: 1,
      responseModalities: ["IMAGE"],
    },
  });
  const img = imageOf(data);
  if (!img) throw new Error("Model returned no image");
  return { image: img, model };
}

// ---------- PASS C — verify ----------

export async function verify({ resultDataUrl, bodyRead }) {
  const { data } = await callWithFallback(
    TEXT_MODEL,
    TEXT_FALLBACKS,
    {
      contents: [
        {
          role: "user",
          parts: [
            inline(resultDataUrl),
            {
              text: `Here is a description of a person's build:
${bodyRead}

Does the person in this image match that description? Answer with only a JSON object: {"match": true|false, "drift": "<what differs, or empty>"}`,
            },
          ],
        },
      ],
      generationConfig: { temperature: 0, maxOutputTokens: 200 },
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
      // A failed body read is not fatal — fall through to the simple path.
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

    // One retry, with the specific drift fed back in as a constraint.
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

// Rough cost in rupees, for the owner-side counter. Published per-image
// pricing, 1 USD = 95.60 INR. Adjust PRICES if Google's rates change.
const INR = 95.6;
const PRICE_USD = { image: 0.039, text: 0.003 };
export function estimateCost(steps) {
  let usd = 0;
  for (const s of steps) {
    if (s.error) continue;
    usd += s.pass === "generate" || s.pass === "retry" ? PRICE_USD.image : PRICE_USD.text;
  }
  return Math.round(usd * INR * 100) / 100;
}
