import { saveLook } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  const { image } = await req.json();
  if (!image) return Response.json({ error: "Missing image" }, { status: 400 });

  try {
    const id = await saveLook(image);
    return Response.json({ url: new URL(`/look/${id}`, req.url).toString() });
  } catch (e) {
    // The result screen drops the QR silently when this fails, which is
    // the right behaviour in front of a customer but leaves nothing to
    // debug — so say exactly what went wrong, both in the response and
    // in the function logs. /api/health?deep=1 tests the same path.
    const message = String(e?.message || e).slice(0, 400);
    console.error("[share] could not store look:", message);
    return Response.json({ error: "Could not store this look", detail: message }, { status: 502 });
  }
}
