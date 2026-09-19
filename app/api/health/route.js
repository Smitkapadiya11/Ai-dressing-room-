import { NextResponse } from "next/server";
import { hasKey, mode, provider, imageModel, textModel } from "@/lib/ai";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    keyConfigured: hasKey(),
    mode: hasKey() ? mode() : "demo",
    provider: hasKey() ? provider() : null,
    imageModel: imageModel(),
    textModel: textModel(),
    time: new Date().toISOString(),
  });
}
