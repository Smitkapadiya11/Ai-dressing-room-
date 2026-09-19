// ============================================================
//  PROVIDER SWITCH
//
//  Picks between lib/gemini.js and lib/openai.js at request
//  time so the rest of the app (API routes) never has to know
//  which one is live.
//
//  AI_PROVIDER=gemini | openai   forces one.
//  Unset -> auto: Gemini if GEMINI_API_KEY is set, else OpenAI
//           if OPENAI_API_KEY is set, else demo mode (Gemini's
//           demo fallback, same as before this file existed).
// ============================================================

import * as gemini from "./gemini";
import * as openai from "./openai";

export function provider() {
  const pref = (process.env.AI_PROVIDER || "").trim().toLowerCase();
  if (pref === "openai" || pref === "gemini") return pref;
  if (gemini.hasKey()) return "gemini";
  if (openai.hasKey()) return "openai";
  return "gemini";
}

function impl() {
  return provider() === "openai" ? openai : gemini;
}

export const hasKey = () => impl().hasKey();
export const mode = () => impl().mode();
export const tryOn = (args) => impl().tryOn(args);
export const estimateCost = (steps) => impl().estimateCost(steps);

export function imageModel() {
  return provider() === "openai"
    ? process.env.OPENAI_IMAGE_MODEL || "gpt-image-1"
    : process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image";
}

export function textModel() {
  return provider() === "openai"
    ? process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini"
    : process.env.GEMINI_TEXT_MODEL || "gemini-3-flash";
}
