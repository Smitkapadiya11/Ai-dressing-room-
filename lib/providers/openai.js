// Low-level OpenAI calls. UNVERIFIED against a real key in this build —
// no OPENAI_API_KEY was available while writing this. Before shipping:
// run scripts/bakeoff.mjs once for real and fix anything that 404s.
// Model names for "demo" tier and the exact text-model chain are the
// most likely to have moved on since — that's why both are fallback
// chains, not single hardcoded strings, and both are overridable below.

const API_ROOT = "https://api.openai.com/v1";

// OpenAI's portrait is 1024x1536 — 2:3, not 9:16. The totem is 9:16, so
// the result is centre-cropped in CSS with object-fit: cover, not here.
const SIZE = "1024x1536";

const IMAGE_MODEL_CHAINS = {
  test: (process.env.OPENAI_IMAGE_MODEL_TEST || "gpt-image-1-mini").split(","),
  demo: (process.env.OPENAI_IMAGE_MODEL_DEMO || "gpt-image-2.5,gpt-image-2,gpt-image-1.5").split(","),
};
const IMAGE_QUALITY_BY_TIER = { test: "medium", demo: "high" };
const COST_INR_BY_TIER = { test: 1.58, demo: 4.78 };
// The two reference images (person + garment) are billed on top of the
// per-image price.
const IMAGE_INPUT_SURCHARGE_INR = 0.5;

const TEXT_MODELS = (process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini,gpt-4.1-mini").split(",");

function requireKey() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("PROVIDER=openai but OPENAI_API_KEY is missing.");
  return key;
}

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

async function editImage(model, quality, personJpeg, garmentJpeg, prompt) {
  const key = requireKey();
  const form = new FormData();
  form.append("model", model);
  form.append("image[]", new Blob([personJpeg], { type: "image/jpeg" }), "person.jpg");
  form.append("image[]", new Blob([garmentJpeg], { type: "image/jpeg" }), "garment.jpg");
  form.append("prompt", prompt);
  form.append("size", SIZE);
  form.append("quality", quality);
  form.append("n", "1");

  const res = await fetch(`${API_ROOT}/images/edits`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });
  const text = await res.text();
  if (!res.ok) {
    const err = new Error(`OpenAI ${res.status}: ${text.slice(0, 400)}`);
    err.status = res.status;
    throw err;
  }
  const data = JSON.parse(text);
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAI returned no image");
  return Buffer.from(b64, "base64");
}

export async function generateImage({ personJpeg, garmentJpeg, prompt, tier }) {
  const chain = IMAGE_MODEL_CHAINS[tier] || IMAGE_MODEL_CHAINS.demo;
  const quality = IMAGE_QUALITY_BY_TIER[tier] || IMAGE_QUALITY_BY_TIER.demo;
  const { result: jpeg } = await withModelFallback(chain, (m) => editImage(m, quality, personJpeg, garmentJpeg, prompt));
  const costInr = (COST_INR_BY_TIER[tier] ?? COST_INR_BY_TIER.demo) + IMAGE_INPUT_SURCHARGE_INR;
  return { jpeg, costInr };
}

async function generateFrom(model, quality, prompt) {
  const key = requireKey();
  const res = await fetch(`${API_ROOT}/images/generations`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, prompt, size: SIZE, quality, n: 1 }),
  });
  const text = await res.text();
  if (!res.ok) {
    const err = new Error(`OpenAI ${res.status}: ${text.slice(0, 400)}`);
    err.status = res.status;
    throw err;
  }
  const data = JSON.parse(text);
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAI returned no image");
  return Buffer.from(b64, "base64");
}

// No person/garment to edit — a pure text-to-image catalogue product shot.
export async function generateFromText({ prompt, tier }) {
  const chain = IMAGE_MODEL_CHAINS[tier] || IMAGE_MODEL_CHAINS.demo;
  const quality = IMAGE_QUALITY_BY_TIER[tier] || IMAGE_QUALITY_BY_TIER.demo;
  const { result: jpeg } = await withModelFallback(chain, (m) => generateFrom(m, quality, prompt));
  return { jpeg, costInr: COST_INR_BY_TIER[tier] ?? COST_INR_BY_TIER.demo };
}

export async function analyzeImage({ jpeg, prompt, temperature = 0.1, maxOutputTokens = 400 }) {
  const key = requireKey();
  async function callModel(model) {
    const res = await fetch(`${API_ROOT}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        temperature,
        max_tokens: maxOutputTokens,
        reasoning_effort: "minimal",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${jpeg.toString("base64")}` } },
            ],
          },
        ],
      }),
    });
    const text = await res.text();
    if (!res.ok) {
      const err = new Error(`OpenAI ${res.status}: ${text.slice(0, 400)}`);
      err.status = res.status;
      throw err;
    }
    const data = JSON.parse(text);
    return data?.choices?.[0]?.message?.content || "";
  }
  const { result } = await withModelFallback(TEXT_MODELS, callModel);
  return result;
}
