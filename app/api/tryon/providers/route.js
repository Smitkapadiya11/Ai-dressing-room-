import { DEFAULT_ENGINE, listEngines, resolveEngine } from "@/lib/imagegen";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Which engines the model picker may offer. Labels only — never keys.
export function GET() {
  return Response.json({ engines: listEngines(), defaultEngine: resolveEngine(DEFAULT_ENGINE) });
}
