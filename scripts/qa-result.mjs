// Drives the kiosk all the way to the result screen with EVERY paid call
// mocked, so running it costs nothing. Use it to check the result screen
// after any change to Result.js or the scrim, instead of burning real
// generations to look at layout.
//
//   npm run build && npm start -- -p 3430
//   npm run qa:result
//
// Writes before/after PNGs to qa-screenshots/ (gitignored).
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { mkdirSync } from "node:fs";

const B = process.env.QA_BASE_URL || "http://localhost:3430";
const OUT = process.env.OUT_DIR || "qa-screenshots";
mkdirSync(OUT, { recursive: true });

// A real photograph with fine fabric detail — if anything blurs it, the
// weave turns to mush and it is obvious at a glance.
const fake = readFileSync("public/catalogue/nehru-jacket-set.jpg").toString("base64");
const fakeResult = `data:image/jpeg;base64,${fake}`;

// The exact rule that used to sit over the result, so the "before" shot
// is a faithful reproduction and not a guess.
const OLD_SCRIM = `
.result-scrim::before {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background:
    radial-gradient(ellipse 70% 50% at 50% 50%, rgba(8,9,11,0.94) 0%, rgba(8,9,11,0.80) 42%, rgba(8,9,11,0.55) 70%, rgba(8,9,11,0.42) 100%),
    linear-gradient(to bottom, rgba(8,9,11,0.6) 0%, rgba(8,9,11,0.35) 35%, rgba(8,9,11,0.35) 65%, rgba(8,9,11,0.6) 100%) !important;
  backdrop-filter: blur(3px) saturate(0.7);
}`;

async function run({ label, oldScrim, width, height }) {
  const browser = await chromium.launch({
    executablePath: "/opt/pw-browsers/chromium",
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
      "--autoplay-policy=no-user-gesture-required",
    ],
  });
  const ctx = await browser.newContext({
    viewport: { width, height },
    permissions: ["camera"],
  });
  const page = await ctx.newPage();

  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e.message)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

  // ---- every paid call, stubbed ----
  let tryonCalls = 0;
  await page.route("**/api/body-read", (r) =>
    r.fulfill({ json: { bodyRead: "Average height. Shoulders slightly wider than hips. Build average." } })
  );
  await page.route("**/api/tryon", (r) => {
    tryonCalls++;
    return r.fulfill({
      json: {
        image: fakeResult,
        bodyRead: "Average height.",
        recommendedSize: "L",
        suggestedColours: ["Ivory Cream", "Sage Olive"],
        ms: 8200,
        costInr: 0,
        cached: false,
      },
    });
  });
  await page.route("**/api/verify", (r) => r.fulfill({ json: { match: true } }));
  await page.route("**/api/share", (r) =>
    r.fulfill({ json: { url: "https://kapadiya.tech/look/QUJDREVGR0g" } })
  );

  await page.goto(B, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);

  await page.mouse.click(width / 2, height / 2); // poster -> welcome
  await page.getByText("Try it on yourself").click({ timeout: 15000 });

  // countdown is 5s, then capture -> drawer
  await page.waitForSelector(".drawer-card", { timeout: 30000 });
  await page.waitForTimeout(600);

  await page.locator(".drawer-card").first().click();
  await page.waitForTimeout(500);
  await page.getByText("See it on me").first().click();

  // working -> result
  await page.waitForSelector(".result-scrim", { timeout: 30000 });
  if (oldScrim) await page.addStyleTag({ content: OLD_SCRIM });

  // let the 1100ms hero reveal finish completely
  await page.waitForTimeout(2600);
  await page.screenshot({ path: `${OUT}/${label}.png` });

  // Report the computed style actually in effect on the scrim.
  const scrim = await page.evaluate(() => {
    const el = document.querySelector(".result-scrim");
    if (!el) return null;
    const cs = getComputedStyle(el, "::before");
    return { backdropFilter: cs.backdropFilter, background: cs.background.slice(0, 90) };
  });
  const hero = await page.evaluate(() => {
    const el = document.querySelector("img.hero-in");
    if (!el) return null;
    const cs = getComputedStyle(el);
    return { filter: cs.filter, opacity: cs.opacity, hasOn: el.classList.contains("on") };
  });

  console.log(`\n[${label}] tryon calls: ${tryonCalls} (mocked, Rs 0)`);
  console.log(`[${label}] scrim backdrop-filter:`, scrim?.backdropFilter);
  console.log(`[${label}] hero img filter:`, hero?.filter, "| .on:", hero?.hasOn);
  if (errors.length) console.log(`[${label}] console errors:`, errors.slice(0, 5));

  await browser.close();
}

await run({ label: "result-BEFORE-old-scrim", oldScrim: true, width: 720, height: 1280 });
await run({ label: "result-AFTER-fixed", oldScrim: false, width: 720, height: 1280 });
await run({ label: "result-AFTER-laptop", oldScrim: false, width: 1440, height: 900 });
console.log("\ndone");
