// Screenshots / and /mirror at the brief's breakpoints and fails on horizontal scroll.
//   node scripts/qa-home.mjs [base]
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const base = process.argv[2] || "http://localhost:3000";
const out = "qa-screenshots/v2";
mkdirSync(out, { recursive: true });

const sizes = [
  [360, 780],
  [768, 1024],
  [1280, 800],
  [1920, 1080],
];
const browser = await chromium.launch();
let bad = 0;
for (const route of ["/", "/mirror"]) {
  for (const [w, h] of sizes) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base + route, { waitUntil: "networkidle" });
    if (route === "/") {
      // reveal everything, as a scroll-through would
      await page.evaluate(() => document.querySelectorAll(".k-reveal,[data-reveal]").forEach((e) => e.classList.add("is-in")));
    }
    await page.waitForTimeout(900);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    const name = `${route === "/" ? "home" : "mirror"}-${w}`;
    await page.screenshot({ path: `${out}/${name}.png`, fullPage: route === "/" && (w === 360 || w === 1280) });
    const flag = overflow > 0 || errors.length;
    if (flag) bad++;
    console.log(`${name}: overflow ${overflow}px${errors.length ? ` errors: ${errors.join(" | ")}` : ""}`);
    await page.close();
  }
}
await browser.close();
process.exit(bad ? 1 : 0);
