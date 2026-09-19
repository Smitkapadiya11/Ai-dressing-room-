import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { tryOn, hasKey, mode, estimateCost, provider } from "@/lib/ai";
import { byId } from "@/lib/garments";

export const runtime = "nodejs";
export const maxDuration = 120;
export const dynamic = "force-dynamic";

const PUBLIC = () => path.join(process.cwd(), "public");

// Read a garment file off disk and hand it back as a data: URL.
// Path-traversal guarded: the resolved path must stay inside /public.
async function garmentDataUrl(relPath) {
  const abs = path.resolve(PUBLIC(), "." + relPath);
  if (!abs.startsWith(PUBLIC() + path.sep)) throw new Error("Bad garment path");
  const buf = await fs.readFile(abs);
  const ext = path.extname(abs).toLowerCase();
  const mime = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
  return `data:${mime};base64,${buf.toString("base64")}`;
}

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Malformed request" }, { status: 400 });
  }

  const { person, garmentId, bodyRead: cachedBodyRead } = body || {};
  const garment = byId(garmentId);
  if (!garment) {
    return NextResponse.json({ error: "Unknown garment" }, { status: 400 });
  }

  // ---- DEMO MODE ----------------------------------------------------
  // No key? Still works. Pre-rendered look, realistic delay, honest flag.
  if (!hasKey()) {
    await new Promise((r) => setTimeout(r, 2600));
    return NextResponse.json({
      demo: true,
      image: garment.demoResult,
      garmentId,
      mode: "demo",
      totalMs: 2600,
      costInr: 0,
      note: "Demo mode — no GEMINI_API_KEY or OPENAI_API_KEY is set, so this is a pre-rendered look.",
    });
  }

  if (typeof person !== "string" || !person.startsWith("data:image/")) {
    return NextResponse.json({ error: "No photo received" }, { status: 400 });
  }

  try {
    const g = await garmentDataUrl(garment.image);
    const out = await tryOn({
      personDataUrl: person,
      garmentDataUrl: g,
      garment,
      cachedBodyRead: typeof cachedBodyRead === "string" ? cachedBodyRead : null,
    });

    return NextResponse.json({
      demo: false,
      image: out.image,
      bodyRead: out.bodyRead,      // cached client-side for the next garment
      verified: out.verified,
      garmentId,
      mode: out.mode,
      provider: provider(),
      steps: out.steps,
      totalMs: out.totalMs,
      costInr: estimateCost(out.steps),
    });
  } catch (err) {
    const msg = String(err?.message || err);
    const quota = /quota|rate|429|RESOURCE_EXHAUSTED/i.test(msg);
    const billing = /billing|payment|403|PERMISSION_DENIED/i.test(msg);
    return NextResponse.json(
      {
        error: quota
          ? "The mirror is busy. Try once more in a moment."
          : billing
          ? "The mirror's account needs attention."
          : "The mirror could not finish that look.",
        detail: msg.slice(0, 500),
        // Falling back to the demo image keeps the customer's moment intact.
        fallback: garment.demoResult,
      },
      { status: 502 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    keyConfigured: hasKey(),
    mode: hasKey() ? mode() : "demo",
    provider: hasKey() ? provider() : null,
  });
}
