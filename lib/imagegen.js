// THE ONE FUNCTION. Everything above this file calls generate() and
// analyze() and never needs to know which provider is live — switching
// PROVIDER in .env.local is the whole migration.

import * as openaiAdapter from "./providers/openai.js";
import * as geminiAdapter from "./providers/gemini.js";
import * as qwenAdapter from "./providers/qwen.js";
import * as siliconflow from "./providers/siliconflow.js";

export const PROVIDER = (process.env.PROVIDER || "openai").toLowerCase();
export const TIER = (process.env.RESULT_TIER || "test").toLowerCase();

let adapter = openaiAdapter;
if (PROVIDER === "gemini") {
  adapter = geminiAdapter;
} else if (PROVIDER === "qwen") {
  adapter = qwenAdapter;
}

// ---------- Engines the kiosk can pick per fitting ----------
// "house" is whatever PROVIDER is set to. The others show up in the
// model picker only when their key is present. Keys never leave here.
const SF_MODELS = (process.env.SILICONFLOW_MODELS || "black-forest-labs/FLUX.2-flex,black-forest-labs/FLUX.2-pro")
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);

const ENGINES = [
  { id: "house", label: PROVIDER === "qwen" ? "Qwen · local" : PROVIDER, model: PROVIDER, vendor: PROVIDER === "qwen" ? "Your GPU · free" : null, configured: () => true, run: (a) => adapter.generateImage(a) },
  ...SF_MODELS.map((model) => ({
    id: `sf:${model}`,
    label: model.split("/").pop().replace(/-/g, " "),
    model,
    vendor: "SiliconFlow",
    configured: siliconflow.isConfigured,
    run: (a) => siliconflow.generateImage({ ...a, model }),
  })),
  { id: "gemini", label: "Gemini", model: "gemini", configured: () => PROVIDER !== "gemini" && Boolean(process.env.GEMINI_API_KEY), run: (a) => geminiAdapter.generateImage(a) },
  { id: "openai", label: "OpenAI", model: "openai", configured: () => PROVIDER !== "openai" && Boolean(process.env.OPENAI_API_KEY), run: (a) => openaiAdapter.generateImage(a) },
];

export const DEFAULT_ENGINE = process.env.TRYON_DEFAULT_ENGINE || "house";

export function listEngines() {
  return ENGINES.filter((e) => e.configured()).map(({ id, label, model, vendor }) => ({ id, label, model, vendor: vendor || null }));
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
  return e.run({ personJpeg, garmentJpeg, prompt, tier });
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
