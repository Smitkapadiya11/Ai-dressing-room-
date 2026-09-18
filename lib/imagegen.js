// THE ONE FUNCTION. Everything above this file calls generate() and
// analyze() and never needs to know which provider is live — switching
// PROVIDER in .env.local is the whole migration.

import * as openaiAdapter from "./providers/openai";
import * as geminiAdapter from "./providers/gemini";

export const PROVIDER = (process.env.PROVIDER || "openai").toLowerCase();
export const TIER = (process.env.RESULT_TIER || "test").toLowerCase();

const adapter = PROVIDER === "gemini" ? geminiAdapter : openaiAdapter;

// { jpeg: Buffer, costInr: number }
export async function generate({ personJpeg, garmentJpeg, prompt, size }) {
  const tier = (size || TIER).toLowerCase();
  return adapter.generateImage({ personJpeg, garmentJpeg, prompt, tier });
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
