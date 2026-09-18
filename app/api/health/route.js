import { PROVIDER, TIER } from "@/lib/imagegen";

export const runtime = "nodejs";

export async function GET() {
  const keyConfigured =
    PROVIDER === "gemini" ? Boolean(process.env.GEMINI_API_KEY) : Boolean(process.env.OPENAI_API_KEY);

  return Response.json({
    keyConfigured,
    provider: PROVIDER,
    tier: TIER,
    ...(PROVIDER === "gemini" ? { shape: (process.env.GEMINI_API_SHAPE || "A").toUpperCase() } : {}),
  });
}
