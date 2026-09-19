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
  // gpt-image-1 on the end is a safety net, not a guess — it's the one
  // name in this chain confirmed to exist on every account. If the newer
  // names ahead of it 404 (unreleased, renamed, or not enabled on this
  // key), the demo tier still lands on a real, high-quality model instead
  // of failing outright the night before it matters.
  demo: (process.env.OPENAI_IMAGE_MODEL_DEMO || "gpt-image-2.5,gpt-image-2,gpt-image-1.5,gpt-image-1").split(","),
};
// "high" quality is available but NOT the demo default — at OpenAI's
// published rates it runs ~4x medium (see the cost comment below), which
// is too expensive to be a tier default. Set OPENAI_IMAGE_QUALITY_DEMO=high
// only for a final warm-the-cache pass before a meeting, not for testing.
const IMAGE_QUALITY_BY_TIER = {
  test: process.env.OPENAI_IMAGE_QUALITY_TEST || "medium",
  demo: process.env.OPENAI_IMAGE_QUALITY_DEMO || "medium",
};

// ESTIMATED, not yet confirmed against a real OpenAI usage dashboard.
// OpenAI publishes per-size/quality OUTPUT prices (1024x1536, medium =
// $0.041 -> ~Rs 3.92), but that is a text-to-image number. This flow
// sends two reference images (person + garment) through images/edits,
// and reference images are billed as extra image-input tokens on top —
// a field report (see aifreeapi.com's GPT Image 2 pricing writeup, Sep
// 2026) measured a plain 1024x1024 low-quality call at $0.0063 vs the
// same call with two reference images at $0.025 — roughly 4x. Applying
// that ratio to the published 1024x1536 medium output price gives the
// "demo" estimate below. "test" (gpt-image-1-mini) uses a more
// conservative ~2x, since mini's own image-input token rate isn't
// published anywhere. RUN 5-10 REAL FITTINGS AND CHECK YOUR OPENAI
// DASHBOARD — that is ground truth, this is a bridge until then.
const COST_INR_BY_TIER = {
  test: 3.16, // gpt-image-1-mini, medium, ~2x the Rs 1.58 text-only rate
  demo: 15.68, // gpt-image-2/2.5, medium, ~4x the Rs 3.92 text-only rate
};

// The catalogue script has no reference images to edit — plain
// text-to-image, so no edit surcharge applies. These are OpenAI's
// published 1024x1536 "medium" output prices, not an estimate.
const TEXT_TO_IMAGE_COST_INR_BY_TIER = { test: 1.58, demo: 3.92 };

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
  return { jpeg, costInr: COST_INR_BY_TIER[tier] ?? COST_INR_BY_TIER.demo };
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
  return { jpeg, costInr: TEXT_TO_IMAGE_COST_INR_BY_TIER[tier] ?? TEXT_TO_IMAGE_COST_INR_BY_TIER.demo };
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

// GET /v1/models is free and unbilled. It is the only way to learn which
// names in IMAGE_MODEL_CHAINS actually exist on this key without paying
// for a generation to find out the hard way. Caveat: presence in this list
// means the key can see the model, not that /images/edits will accept it —
// but absence is conclusive, and absence is what we are hunting.
export async function listModels() {
  const key = requireKey();
  const res = await fetch(`${API_ROOT}/models`, { headers: { Authorization: `Bearer ${key}` } });
  const text = await res.text();
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${text.slice(0, 400)}`);

  const ids = (JSON.parse(text)?.data || []).map((m) => m.id);
  const available = new Set(ids);
  // Mirrors withModelFallback: the first name in the chain that exists is
  // the one a real call would land on.
  const resolve = (chain) => ({
    chain: chain.map((m) => m.trim()),
    present: chain.map((m) => m.trim()).filter((m) => available.has(m)),
    resolvesTo: chain.map((m) => m.trim()).find((m) => available.has(m)) || null,
  });

  return {
    totalModels: ids.length,
    imageModels: ids.filter((id) => id.includes("image")).sort(),
    demoTier: resolve(IMAGE_MODEL_CHAINS.demo),
    testTier: resolve(IMAGE_MODEL_CHAINS.test),
    textModels: resolve(TEXT_MODELS),
  };
}
