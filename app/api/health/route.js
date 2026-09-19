import { del, list, put } from "@vercel/blob";
import { PROVIDER, TIER } from "@/lib/imagegen";

export const runtime = "nodejs";
// Reports live env state, so it must never be served from a build-time cache.
export const dynamic = "force-dynamic";

// A real Blob round-trip: write two bytes, read them back, delete them.
// Costs nothing and touches no AI provider, but it is the only way to tell
// "Blob is connected" apart from "a token exists but does not work" —
// which is the difference between QR codes working and silently 404ing.
// Runs only on /api/health?deep=1, never on the plain health check.
async function blobSelfTest() {
  const started = Date.now();
  const pathname = `healthcheck/${crypto.randomUUID()}.txt`;
  let url;
  try {
    ({ url } = await put(pathname, Buffer.from("ok"), {
      access: "public",
      contentType: "text/plain",
      addRandomSuffix: false,
    }));

    const res = await fetch(url, { cache: "no-store" });
    const body = await res.text();
    const { blobs } = await list({ prefix: pathname, limit: 1 });

    return {
      ok: body === "ok" && blobs.length === 1,
      wrote: true,
      readBack: body === "ok",
      listed: blobs.length === 1,
      ms: Date.now() - started,
    };
  } catch (e) {
    return { ok: false, error: String(e?.message || e).slice(0, 400), ms: Date.now() - started };
  } finally {
    // Never leave the probe file behind, even if a step above threw.
    if (url) await del(url).catch(() => {});
  }
}

export async function GET(req) {
  const keyConfigured =
    PROVIDER === "gemini" ? Boolean(process.env.GEMINI_API_KEY) : Boolean(process.env.OPENAI_API_KEY);
  const blobConfigured = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

  const deep = new URL(req.url).searchParams.get("deep") === "1";

  return Response.json({
    keyConfigured,
    provider: PROVIDER,
    tier: TIER,
    // Both the QR share link and the generation cache need Blob. If this
    // is false, QR codes will 404 and every repeat fitting gets billed
    // again — so it is the first thing to check when either misbehaves.
    blobConfigured,
    ...(deep ? { blob: blobConfigured ? await blobSelfTest() : { ok: false, error: "BLOB_READ_WRITE_TOKEN is not set" } } : {}),
    ...(PROVIDER === "gemini" ? { shape: (process.env.GEMINI_API_SHAPE || "A").toUpperCase() } : {}),
  });
}
