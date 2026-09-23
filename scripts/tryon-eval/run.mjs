// Try-on honesty eval. Runs every test photo × every test garment through
// the ACTIVE provider (via a running server) and writes a side-by-side
// HTML report: input | garment | output, plus the log-only drift check.
//
//   npm run dev                         (in another terminal)
//   node scripts/tryon-eval/run.mjs     [--base http://localhost:3000]
//
// Photos: scripts/tryon-eval/photos/*.jpg — consented only. See README.md.
// Each pair costs one real generation. Results are NOT cached-bypassed:
// a repeat run of the same photo is free and returns the same image.

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
const ROOT = path.resolve(HERE, "../..");
const base = process.argv.includes("--base") ? process.argv[process.argv.indexOf("--base") + 1] : "http://localhost:3000";

// saree, lehenga, kurta, shirt — ids from lib/catalogue.js
const GARMENTS = [
  { id: "banarasi-silk-saree", label: "Saree" },
  { id: "zardozi-lehenga-choli", label: "Lehenga" },
  { id: "chanderi-salwar-kameez", label: "Kurta" },
  { id: "oxford-shirt-chinos", label: "Shirt" },
];

const photosDir = path.join(HERE, "photos");
const outDir = path.join(HERE, "out");
mkdirSync(outDir, { recursive: true });

const photos = existsSync(photosDir) ? readdirSync(photosDir).filter((f) => /\.jpe?g$/i.test(f)) : [];
if (!photos.length) {
  console.error(`No photos in ${photosDir}. Add consented .jpg files named as in README.md.`);
  process.exit(1);
}

const dataUrl = (file) => `data:image/jpeg;base64,${readFileSync(file).toString("base64")}`;
const post = async (route, body) => {
  const res = await fetch(`${base}${route}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `${route} ${res.status}`);
  return json;
};

const rows = [];
for (const photo of photos) {
  const person = dataUrl(path.join(photosDir, photo));
  let bodyRead = "";
  try {
    ({ bodyRead } = await post("/api/body-read", { person }));
  } catch (e) {
    console.warn(`body-read failed for ${photo}: ${e.message}`);
  }
  for (const g of GARMENTS) {
    const name = `${path.parse(photo).name}__${g.id}.jpg`;
    process.stdout.write(`${photo} × ${g.label} … `);
    const row = { photo, garment: g, out: name, ms: 0, drift: "", error: "" };
    try {
      const r = await post("/api/tryon", { person, garmentId: g.id, bodyRead });
      writeFileSync(path.join(outDir, name), Buffer.from(r.image.split(",")[1], "base64"));
      row.ms = r.ms;
      // Log-only guardrail: does the result still match the measured build?
      if (bodyRead) {
        const v = await post("/api/verify", { image: r.image, bodyRead }).catch(() => null);
        if (v && v.match === false) row.drift = v.drift || "build drift";
      }
      console.log(row.drift ? `DRIFT: ${row.drift}` : `ok (${r.ms} ms)`);
    } catch (e) {
      row.error = e.message;
      console.log(`FAILED: ${e.message}`);
    }
    rows.push(row);
  }
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const rel = (p) => path.relative(outDir, p).split(path.sep).join("/");
const html = `<!doctype html><meta charset="utf-8"><title>Try-on eval</title>
<style>body{font:14px system-ui;background:#111;color:#eee;margin:24px}table{border-collapse:collapse}td,th{padding:8px;border-bottom:1px solid #333;vertical-align:top;text-align:left}img{height:320px;display:block}.bad{color:#f87171}.ok{color:#86efac}</style>
<h1>Try-on eval — ${new Date().toLocaleString()}</h1>
<p>Check each row: same face, same skin tone, same body size, no makeup added, garment colour and print exact.</p>
<table><tr><th>Input</th><th>Garment</th><th>Output</th><th>Check</th></tr>
${rows
  .map(
    (r) => `<tr><td><img src="${rel(path.join(photosDir, r.photo))}"><br>${esc(r.photo)}</td>
<td><img src="${rel(path.join(ROOT, "public/catalogue", r.garment.id + ".jpg"))}"><br>${r.garment.label}</td>
<td>${r.error ? `<span class="bad">${esc(r.error)}</span>` : `<img src="${r.out}">`}</td>
<td>${r.error ? "" : r.drift ? `<span class="bad">Drift flagged: ${esc(r.drift)}</span>` : `<span class="ok">No build drift flagged</span>`}<br>${r.ms} ms</td></tr>`
  )
  .join("\n")}
</table>`;
writeFileSync(path.join(outDir, "report.html"), html);
console.log(`\nReport: ${path.join(outDir, "report.html")}`);
