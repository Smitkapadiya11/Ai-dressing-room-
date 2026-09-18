// Low-level Gemini calls — the two live request shapes for image
// generation, hidden behind generateImage(), plus the text/vision calls
// used for the body read and the fit check.

const API_ROOT = "https://generativelanguage.googleapis.com/v1beta";

const IMAGE_MODELS = ["gemini-3.1-flash-image", "gemini-2.5-flash-image"];
const TEXT_MODELS = ["gemini-flash-lite-latest", "gemini-2.5-flash-lite"];

const SHAPE = (process.env.GEMINI_API_SHAPE || "A").toUpperCase();

// RESOLUTION — this one line is most of the running cost on this provider.
const SIZE_BY_TIER = { test: "512px", demo: "1K" };
const COST_INR_BY_TIER = { test: 4.3, demo: 6.41 };

function requireKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("PROVIDER=gemini but GEMINI_API_KEY is missing.");
  return key;
}

const inline = (jpeg) => ({ inlineData: { mimeType: "image/jpeg", data: jpeg.toString("base64") } });

// ---------- Shape A — classic generateContent ----------

async function callGenerateContentImage(model, parts, imageSize, aspectRatio) {
  const key = requireKey();
  const res = await fetch(`${API_ROOT}/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      contents: [{ role: "user", parts }],
      generationConfig: {
        temperature: 0.15,
        seed: 42,
        candidateCount: 1,
        responseModalities: ["IMAGE"],
        imageConfig: { imageSize, aspectRatio },
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
  return Buffer.from(part.inlineData.data, "base64");
}

// ---------- Shape B — /interactions ----------

async function callInteractionsImage(model, parts, imageSize, aspectRatio) {
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
      temperature: 0.15,
      seed: 42,
      thinking_level: "minimal",
      response_format: { type: "image", image_size: imageSize, aspect_ratio: aspectRatio },
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
  return Buffer.from(img.data, "base64");
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

export async function generateImage({ personJpeg, garmentJpeg, prompt, tier }) {
  const imageSize = SIZE_BY_TIER[tier] || SIZE_BY_TIER.demo;
  const parts = [inline(personJpeg), inline(garmentJpeg), { text: prompt }];
  const call = SHAPE === "B" ? callInteractionsImage : callGenerateContentImage;
  const { result: jpeg } = await withModelFallback(IMAGE_MODELS, (m) => call(m, parts, imageSize, "9:16"));
  return { jpeg, costInr: COST_INR_BY_TIER[tier] ?? COST_INR_BY_TIER.demo };
}

// No person/garment to edit — a pure text-to-image catalogue product shot.
export async function generateFromText({ prompt, tier }) {
  const imageSize = SIZE_BY_TIER[tier] || SIZE_BY_TIER.demo;
  const call = SHAPE === "B" ? callInteractionsImage : callGenerateContentImage;
  const { result: jpeg } = await withModelFallback(IMAGE_MODELS, (m) => call(m, [{ text: prompt }], imageSize, "3:4"));
  return { jpeg, costInr: COST_INR_BY_TIER[tier] ?? COST_INR_BY_TIER.demo };
}

// ---------- text / vision ----------

async function callGenerateContentText(model, parts, temperature, maxOutputTokens) {
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

export async function analyzeImage({ jpeg, prompt, temperature = 0.1, maxOutputTokens = 400 }) {
  const parts = [inline(jpeg), { text: prompt }];
  const { result } = await withModelFallback(TEXT_MODELS, (m) => callGenerateContentText(m, parts, temperature, maxOutputTokens));
  return result;
}
