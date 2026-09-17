import { saveLook } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(req) {
  const { image } = await req.json();
  if (!image) return Response.json({ error: "Missing image" }, { status: 400 });
  const id = saveLook(image);
  const url = new URL(`/look/${id}`, req.url).toString();
  return Response.json({ url });
}
