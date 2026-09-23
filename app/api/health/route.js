import { del, list, put } from "@vercel/blob";
import { PROVIDER, TIER } from "@/lib/imagegen";
import { listModels as listOpenAiModels, probeTextModel } from "@/lib/providers/openai";

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
    PROVIDER === "gemini"
      ? Boolean(process.env.GEMINI_API_KEY)
      : PROVIDER === "qwen"
      ? Boolean(process.env.QWEN_API_URL || true)
      : Boolean(process.env.OPENAI_API_KEY);
  const blobConfigured = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

  const params = new URL(req.url).searchParams;
  const deep = params.get("deep") === "1";
  // ?models=1 answers "which name in the fallback chain does a real call
  // actually land on?" using OpenAI's free, unbilled model listing — so the
  // question costs nothing instead of one generation per guess.
  const wantModels = params.get("models") === "1" && PROVIDER === "openai";

  let models;
  if (wantModels) {
    try {
      models = keyConfigured
        ? await listOpenAiModels()
        : { error: "OPENAI_API_KEY is not set" };
    } catch (e) {
      models = { error: String(e?.message || e).slice(0, 400) };
    }
  }

  // ?probe=text costs at most one token and settles why /api/body-read 500s.
  let textProbe;
  if (params.get("probe") === "text" && PROVIDER === "openai" && keyConfigured) {
    try {
      textProbe = await probeTextModel();
    } catch (e) {
      textProbe = { error: String(e?.message || e).slice(0, 400) };
    }
  }

  return Response.json({
    keyConfigured,
    provider: PROVIDER,
    tier: TIER,
    // Both the QR share link and the generation cache need Blob. If this
    // is false, QR codes will 404 and every repeat fitting gets billed
    // again — so it is the first thing to check when either misbehaves.
    blobConfigured,
    ...(deep ? { blob: blobConfigured ? await blobSelfTest() : { ok: false, error: "BLOB_READ_WRITE_TOKEN is not set" } } : {}),
    ...(models ? { models } : {}),
    ...(textProbe ? { textProbe } : {}),
    ...(PROVIDER === "gemini" ? { shape: (process.env.GEMINI_API_SHAPE || "A").toUpperCase() } : {}),
  });
}
