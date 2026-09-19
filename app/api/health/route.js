import { PROVIDER, TIER } from "@/lib/imagegen";

export const runtime = "nodejs";
// Reports live env state, so it must never be served from a build-time cache.
export const dynamic = "force-dynamic";

export async function GET() {
  const keyConfigured =
    PROVIDER === "gemini" ? Boolean(process.env.GEMINI_API_KEY) : Boolean(process.env.OPENAI_API_KEY);

  return Response.json({
    keyConfigured,
    provider: PROVIDER,
    tier: TIER,
    // Both the QR share link and the generation cache need Blob. If this
    // is false, QR codes will 404 and every repeat fitting gets billed
    // again — so it is the first thing to check when either misbehaves.
    blobConfigured: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    ...(PROVIDER === "gemini" ? { shape: (process.env.GEMINI_API_SHAPE || "A").toUpperCase() } : {}),
  });
}
