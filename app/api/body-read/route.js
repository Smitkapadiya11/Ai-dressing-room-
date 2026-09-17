import { readBody, parseBodyRead, TEXT_COST_INR } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 120;

// TRICK ONE calls this the moment the shutter fires, in the background,
// while the catalogue drawer is already open. By the time she taps a
// garment the reading is usually already in hand.
export async function POST(req) {
  const { person } = await req.json();
  if (!person) return Response.json({ error: "Missing photo" }, { status: 400 });

  const t0 = Date.now();
  try {
    const bodyRead = await readBody(person);
    const { recommendedSize, suggestedColours } = parseBodyRead(bodyRead);
    return Response.json({
      bodyRead,
      recommendedSize,
      suggestedColours,
      ms: Date.now() - t0,
      costInr: TEXT_COST_INR,
    });
  } catch (e) {
    return Response.json({ error: e.message || "Could not read the photo." }, { status: 500 });
  }
}
