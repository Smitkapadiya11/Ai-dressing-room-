import { SIZE } from "@/lib/gemini";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({
    keyConfigured: Boolean(process.env.GEMINI_API_KEY),
    shape: (process.env.GEMINI_API_SHAPE || "A").toUpperCase(),
    resultSize: SIZE,
  });
}
