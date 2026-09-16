import { NextResponse } from "next/server";
import { hasKey, mode } from "@/lib/gemini";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    keyConfigured: hasKey(),
    mode: hasKey() ? mode() : "demo",
    imageModel: process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image",
    textModel: process.env.GEMINI_TEXT_MODEL || "gemini-3-flash",
    time: new Date().toISOString(),
  });
}
