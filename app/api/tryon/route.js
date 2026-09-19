import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { byId } from "@/lib/catalogue";
import { cacheKey, readCache, writeCache } from "@/lib/cache";
import { generateTryOn, inlineOf, parseBodyRead } from "@/lib/engine";
import { PROVIDER, TIER } from "@/lib/imagegen";

export const runtime = "nodejs";
export const maxDuration = 120;

function garmentDataUrl(garment) {
  const file = path.join(process.cwd(), "public", garment.image);
  if (!existsSync(file)) {
    throw new Error(`No photo for "${garment.name}" yet — run scripts/prep-photos.mjs or scripts/build-catalogue.mjs.`);
  }
  return `data:image/jpeg;base64,${readFileSync(file).toString("base64")}`;
}

function logFitting(entry) {
  // Local dev only — same read-only-filesystem reasoning as lib/cache.js.
  try {
    mkdirSync(".data", { recursive: true });
    appendFileSync(".data/fittings.jsonl", JSON.stringify(entry) + "\n");
  } catch {
    // Not fatal — the fitting already succeeded, this is just the log.
  }
}

export async function POST(req) {
  const { person, garmentId, colourway, bodyRead } = await req.json();
  const garment = byId(garmentId);
  if (!person || !garment) {
    return Response.json({ error: "Missing photo or garment" }, { status: 400 });
  }

  const t0 = Date.now();
  const personBytes = Buffer.from(inlineOf(person).data, "base64");
  const colourwayObj = garment.colourways.find((c) => c.name === colourway) || null;
  const key = cacheKey({ personBytes, garmentId, colourway: colourwayObj?.name || "", provider: PROVIDER, tier: TIER });
  const { recommendedSize, suggestedColours } = parseBodyRead(bodyRead);

  // THE CACHE — the same photo through the same garment tonight should
  // cost zero the second time.
  const cached = readCache(key);
  if (cached) {
    const ms = Date.now() - t0;
    logFitting({ time: new Date().toISOString(), garment: garment.id, colourway: colourwayObj?.name || null, provider: PROVIDER, tier: TIER, ms, costInr: 0, cached: true });
    return Response.json({
      image: `data:image/jpeg;base64,${cached.toString("base64")}`,
      bodyRead,
      recommendedSize,
      suggestedColours,
      ms,
      costInr: 0,
      cached: true,
    });
  }

  try {
    const garmentImage = garmentDataUrl(garment);
    const { image, costInr } = await generateTryOn({
      personDataUrl: person,
      garmentDataUrl: garmentImage,
      garment,
      bodyRead,
      colourway: colourwayObj,
    });
    writeCache(key, Buffer.from(inlineOf(image).data, "base64"));

    const ms = Date.now() - t0;
    logFitting({ time: new Date().toISOString(), garment: garment.id, colourway: colourwayObj?.name || null, provider: PROVIDER, tier: TIER, ms, costInr, cached: false });

    return Response.json({ image, bodyRead, recommendedSize, suggestedColours, ms, costInr, cached: false });
  } catch (e) {
    // Never fall back to a pre-rendered image — say plainly what happened.
    return Response.json({ error: e.message || "That look did not come through." }, { status: 500 });
  }
}
