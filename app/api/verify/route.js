import { TEXT_COST_INR, verify } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 60;

// TRICK TWO calls this only after the result is already on screen. A
// failed or unparseable check is never loud — it just means the "Fit
// verified" mark stays off.
export async function POST(req) {
  const { image, bodyRead } = await req.json();
  if (!image || !bodyRead) {
    return Response.json({ match: null, drift: "", costInr: 0 });
  }
  try {
    const result = await verify({ resultDataUrl: image, bodyRead });
    return Response.json({ ...result, costInr: TEXT_COST_INR });
  } catch {
    return Response.json({ match: null, drift: "", costInr: 0 });
  }
}
