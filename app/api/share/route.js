import { NextResponse } from "next/server";
import { put } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  const { image, garmentName, price } = await req.json().catch(() => ({}));
  if (typeof image !== "string" || !image) {
    return NextResponse.json({ error: "No image" }, { status: 400 });
  }
  const id = put(image, { garmentName, price });

  // Build a URL a phone on the shop wifi can actually reach — swap a
  // localhost host for the LAN address when one is available.
  const host = req.headers.get("host") || "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  return NextResponse.json({ id, url: `${proto}://${host}/look/${id}` });
}
