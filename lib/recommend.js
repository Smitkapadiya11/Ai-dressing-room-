// "Also made for you" — two rules, not a scoring engine. Two rules you
// can explain to an investor in one sentence beat five you cannot.

import { GARMENTS } from "./catalogue";

const REASON = "Suits your colouring";

function colourMatches(colourwayName, suggested) {
  const a = colourwayName.toLowerCase();
  const b = suggested.toLowerCase();
  return a.includes(b) || b.includes(a);
}

export function recommend({ category, suggestedColours = [] }) {
  if (suggestedColours.length === 0) return [];

  return GARMENTS
    // Rule 2 — drop anything in the same category she just tried.
    .filter((g) => g.category !== category)
    // Rule 1 — keep garments with a colourway matching one of the three
    // colours the body read suggested (case-insensitive match on name).
    .filter((g) => g.colourways.some((c) => suggestedColours.some((s) => colourMatches(c.name, s))))
    .slice(0, 4)
    .map((garment) => ({ garment, reason: REASON }));
}
