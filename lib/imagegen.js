// THE ONE FUNCTION. Everything above this file calls generate() and
// analyze() and never needs to know which provider is live — switching
// PROVIDER in .env.local is the whole migration.

import * as openaiAdapter from "./providers/openai.js";
import * as geminiAdapter from "./providers/gemini.js";
import * as qwenAdapter from "./providers/qwen.js";

export const PROVIDER = (process.env.PROVIDER || "openai").toLowerCase();
export const TIER = (process.env.RESULT_TIER || "test").toLowerCase();

let adapter = openaiAdapter;
if (PROVIDER === "gemini") {
  adapter = geminiAdapter;
} else if (PROVIDER === "qwen") {
  adapter = qwenAdapter;
}

// ---------- The one engine ----------
// Customers see a single engine: "Kapadiya_ai v1.1". Under the hood it is
// OpenAI gpt-image-2.5-sunburst at medium quality (~₹4.27 a fitting —
// internal only, never shown on the site). Qwen/Gemini houses still work
// via PROVIDER, but there is no picker any more.
const HOUSE_MODEL = process.env.KAPADIYA_AI_MODEL || "gpt-image-2.5-sunburst";
const HOUSE_QUALITY = process.env.KAPADIYA_AI_QUALITY || "medium";

const ENGINES = [
  {
    id: "house",
    label: "Kapadiya_ai v1.1",
    configured: () => true,
    run: (a) => (PROVIDER === "openai" ? openaiAdapter.generateImage({ ...a, model: HOUSE_MODEL, quality: HOUSE_QUALITY }) : adapter.generateImage(a)),
  },
];

export const DEFAULT_ENGINE = "house";

export function listEngines() {
  return ENGINES.map(({ id, label }) => ({ id, label }));
}

// Unknown or unconfigured ids fall back to the default, never an error.
export function resolveEngine(id) {
  const ok = (e) => e && e.configured();
  const hit = ENGINES.find((e) => e.id === id);
  if (ok(hit)) return hit.id;
  const def = ENGINES.find((e) => e.id === DEFAULT_ENGINE);
  return ok(def) ? def.id : "house";
}

// { jpeg: Buffer, costInr: number }
export async function generate({ personJpeg, garmentJpeg, prompt, size, engine }) {
  const tier = (size || TIER).toLowerCase();
  const e = ENGINES.find((x) => x.id === resolveEngine(engine));
  try {
    return await e.run({ personJpeg, garmentJpeg, prompt, tier });
  } catch (err) {
    // A cloud engine failing (no credit, busy) should not cost the
    // customer her look — fall back to the house engine once.
    // A timeout has already used most of the route budget — no second try.
    if (e.id === "house" || err.name === "TimeoutError") throw err;
    console.error(`[imagegen] ${e.id} failed, falling back to house: ${err.message}`);
    return adapter.generateImage({ personJpeg, garmentJpeg, prompt, tier });
  }
}

// Catalogue product shots — no person/garment photo to edit, just a prompt.
export async function generateFromText({ prompt, size }) {
  const tier = (size || TIER).toLowerCase();
  return adapter.generateFromText({ prompt, tier });
}

// Text calls (body read, fit check) are short structured replies, not
// reasoning, so they always use the lite/mini model on whichever
// provider is live.
export const TEXT_COST_INR = 0.2;

export async function analyze({ jpeg, prompt, temperature, maxOutputTokens }) {
  const text = await adapter.analyzeImage({ jpeg, prompt, temperature, maxOutputTokens });
  return { text, costInr: TEXT_COST_INR };
}
