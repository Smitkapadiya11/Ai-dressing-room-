// Low-level OpenAI calls. Verified against a real key and real production
// billing (see the cost comments below). Model names for "demo" tier and
// the exact text-model chain are the most likely to move on as OpenAI
// ships new ones — that's why both are fallback chains, not single
// hardcoded strings, and both are overridable via env vars below.

const API_ROOT = "https://api.openai.com/v1";

// OpenAI's portrait is 1024x1536 — 2:3, not 9:16. The totem is 9:16, so
// the result is centre-cropped in CSS with object-fit: cover, not here.
const SIZE = "1024x1536";

const IMAGE_MODEL_CHAINS = {
  test: (process.env.OPENAI_IMAGE_MODEL_TEST || "gpt-image-1-mini").split(","),
  // "gpt-image-2.5" (bare) is NOT a real model — the actual names are
  // gpt-image-2.5-sunburst and gpt-image-2.5-flare (confirmed against
  // OpenAI's /v1/models on this key — GET /api/health?models=1).
  // gpt-image-1 stays last as the "slightly higher, not much" fallback:
  // $10/$40 vs $8/$30 per 1M tokens, about 30% more, and the one name in
  // this whole chain guaranteed to exist on every account.
  //
  // Pinned to gpt-image-2.5-sunburst — OpenAI's precision-editing tier,
  // better at targeting just the garment while leaving the rest of the
  // reference photo (the customer's actual face and body) alone, which is
  // the one thing this whole prompt in lib/engine.js is built to protect.
  // Same published per-token rate as gpt-image-2/flare/1.5, so this is a
  // pure quality upgrade, not a pricier one. The old chain (gpt-image-2,
  // ...) stays right behind it — untouched, never a downside to fall
  // through to on an outage.
  demo: (
    process.env.OPENAI_IMAGE_MODEL_DEMO ||
    "gpt-image-2.5-sunburst,gpt-image-2,gpt-image-2.5-flare,gpt-image-1.5,gpt-image-1"
  ).split(","),
};
// "low" is the demo default — confirmed against OpenAI's published rate
// for gpt-image-2.5-sunburst (~Rs 4.27/image, see the cost comment below).
// "medium"/"high" are available and cost more (medium roughly 2x, high
// roughly 8x, per OpenAI's published per-quality token counts) — set
// OPENAI_IMAGE_QUALITY_DEMO=medium only for a final warm-the-cache pass
// before a meeting, not for routine use.
const IMAGE_QUALITY_BY_TIER = {
  test: process.env.OPENAI_IMAGE_QUALITY_TEST || "medium",
  demo: process.env.OPENAI_IMAGE_QUALITY_DEMO || "low",
};

// demo is now gpt-image-2.5-sunburst at "low" quality — Rs 4.27/image,
// OpenAI's published rate for this exact model+quality pair. This is a
// quoted rate, not yet measured from this account's own billing the way
// the old gpt-image-2/medium figure (Rs 3.80) was — re-measure from the
// OpenAI dashboard after the first real fittings land and replace this
// with the real number, same as before. It costing more than the old
// medium-quality figure despite "low" being the cheaper setting is
// expected: it's a different model, not the same one at a lower setting.
// "test" (gpt-image-1-mini) is still an estimate; it's cheap enough that
// being off by 2x doesn't matter the way it does for demo tier.
const COST_INR_BY_TIER = {
  test: 3.16, // gpt-image-1-mini, medium, estimated ~2x the Rs 1.58 text-only rate
  demo: 4.27, // gpt-image-2.5-sunburst, low — OpenAI's published rate, see above
};

// The catalogue script has no reference images to edit — plain
// text-to-image, so no edit surcharge applies. These are OpenAI's
// published 1024x1536 "medium" output prices, not an estimate.
const TEXT_TO_IMAGE_COST_INR_BY_TIER = { test: 1.58, demo: 3.92 };

const TEXT_MODELS = (process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini,gpt-4.1-mini").split(",");

// o-series and gpt-5 are reasoning models; the 4o/4.1 family is not.
const isReasoningModel = (m) => /^(o\d|gpt-5)/.test(String(m).trim());

function requireKey() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("PROVIDER=openai but OPENAI_API_KEY is missing.");
  return key;
}

// Is this error "this model can't take this request" (try the next one) or
// "this request is bad" (stop — retrying costs money and fails the same way)?
//
// The old test only matched /model/i, which meant a 400 for an unsupported
// PARAMETER threw on the spot instead of advancing. That is why every call
// died on the first name in the chain rather than falling through.
//
// Deliberately narrow: prompt rejections and content-policy 400s do NOT
// match, so a bad prompt still fails once instead of being retried against
// every model in the chain at full price.
function isModelIncompatible(e) {
  if (e.status === 404) return true;
  if (e.status !== 400) return false;
  return /model|unsupported|unrecognized|not supported|unknown parameter|invalid[_ ]parameter/i.test(
    e.message || ""
  );
}

async function withModelFallback(list, fn) {
  let last;
  for (const model of list) {
    try {
      return { result: await fn(model), model };
    } catch (e) {
      last = e;
      if (!isModelIncompatible(e)) throw e;
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
        // Only the reasoning models accept this. gpt-4o-mini rejects the
        // whole request with a 400 if it is present.
        ...(isReasoningModel(model) ? { reasoning_effort: "minimal" } : {}),
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

// Diagnostic only. Sends the smallest legal chat request twice — once with
// reasoning_effort, once without — to settle whether that parameter is what
// kills /api/body-read. A rejected parameter fails validation before any
// tokens are metered, so the failing case is free; the passing case is one
// token. Never called by the kiosk, only by /api/health?probe=text.
export async function probeTextModel() {
  const key = requireKey();
  const model = TEXT_MODELS[0].trim();

  async function attempt(withReasoningEffort) {
    const res = await fetch(`${API_ROOT}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        max_tokens: 1,
        messages: [{ role: "user", content: "hi" }],
        ...(withReasoningEffort ? { reasoning_effort: "minimal" } : {}),
      }),
    });
    const text = await res.text();
    return {
      status: res.status,
      ok: res.ok,
      error: res.ok ? null : text.slice(0, 300),
      // Would the old gate have advanced to the next model, or thrown here?
      wouldFallBack: res.ok ? null : isModelIncompatible({ status: res.status, message: text }),
    };
  }

  return {
    model,
    withReasoningEffort: await attempt(true),
    withoutReasoningEffort: await attempt(false),
  };
}
