// Strips {{PLACEHOLDER}} markers so they never ship as visible text.
// The list of what still needs filling in lives in docs/CONTENT_TODO.md.
export const clean = (s) => (s || "").replace(/\s*\{\{[^}]*\}\}\s*/g, " ").trim();
