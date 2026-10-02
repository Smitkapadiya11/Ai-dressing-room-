// The try-on is invite-only: the marketing site is public, but the mirror and
// every endpoint that spends model credits sit behind one shared password.
// TRYON_PASSWORD lives in the Vercel env, never in this (public) repo.

export const ACCESS_COOKIE = "k_access";
export const ACCESS_MAX_AGE = 60 * 60 * 24 * 90; // 90 days

export function accessPassword() {
  return process.env.TRYON_PASSWORD || "";
}

// Unset password: open in local dev, locked shut in production.
export function gateDisabled() {
  return !accessPassword() && process.env.NODE_ENV !== "production";
}

// The cookie holds a digest, not the password, and changing TRYON_PASSWORD
// (or ACCESS_SECRET) signs everyone out.
export async function accessToken() {
  const pw = accessPassword();
  if (!pw) return null;
  const data = new TextEncoder().encode(`${pw}:${process.env.ACCESS_SECRET || "kapadiya"}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function safeNext(next) {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/mirror";
}
