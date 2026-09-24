// SiliconFlow provider — hosted image-edit models behind one endpoint.
//
// Image order is fixed: `image` = PERSON, `image2` = GARMENT. The account
// resolved on 2026-09-23 has no Qwen-Image-Edit-2509 (the only Qwen edit
// model is the single-image Qwen/Qwen-Image-Edit, which can't do try-on),
// so the multi-reference FLUX.2 models are the ones exposed.
//
// The returned image URL expires after an hour, so the bytes are
// downloaded here and the URL never leaves the server.

const BASE_URL = process.env.SILICONFLOW_BASE_URL || "https://api.siliconflow.com/v1";
// Kept well under the route's 120s maxDuration so a stalled call still
// leaves time for the house-engine fallback in lib/imagegen.js.
const TIMEOUT_MS = 45_000;
const RETRY_STATUSES = new Set([429, 503, 504]);

export const isConfigured = () => Boolean(process.env.SILICONFLOW_API_KEY);
export const priceInr = () => Number(process.env.SILICONFLOW_PRICE_INR || 0);

const CLEAN_ERRORS = {
  401: "SiliconFlow key invalid",
  402: "SiliconFlow balance is empty — top up at cloud.siliconflow.com",
  403: "SiliconFlow balance too low",
  429: "SiliconFlow rate limited — try again in a moment",
  503: "SiliconFlow busy — try again in a moment",
  504: "SiliconFlow timed out",
};

async function post(body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(`${BASE_URL}/images/generations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SILICONFLOW_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function generateImage({ personJpeg, garmentJpeg, prompt, model }) {
  if (!isConfigured()) throw new Error("SiliconFlow is not configured");

  const body = {
    model,
    prompt,
    image: `data:image/jpeg;base64,${personJpeg.toString("base64")}`,
    image2: `data:image/jpeg;base64,${garmentJpeg.toString("base64")}`,
  };

  let res = await post(body);
  if (RETRY_STATUSES.has(res.status)) {
    await new Promise((r) => setTimeout(r, 2000));
    res = await post(body);
  }

  const traceId = res.headers.get("x-siliconcloud-trace-id") || undefined;
  if (!res.ok) {
    const raw = await res.text();
    console.error(`[siliconflow] ${res.status} trace=${traceId} ${raw.slice(0, 500)}`);
    throw new Error(CLEAN_ERRORS[res.status] || `SiliconFlow error (${res.status})`);
  }

  const data = await res.json();
  const url = data?.images?.[0]?.url || data?.data?.[0]?.url;
  if (!url) throw new Error("SiliconFlow returned no image");

  const img = await fetch(url);
  if (!img.ok) throw new Error("Could not download the SiliconFlow result");
  return {
    jpeg: Buffer.from(await img.arrayBuffer()),
    costInr: priceInr(),
    seed: data.seed,
    traceId,
  };
}
