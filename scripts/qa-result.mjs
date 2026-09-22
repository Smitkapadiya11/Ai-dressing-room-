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
const fake = readFileSync("public/catalogue/emerald-velvet-waistcoat.jpg").toString("base64");
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
    // Was hardcoded to the Linux sandbox path, which made this harness
    // unrunnable anywhere else. Falls back to Playwright's own download.
    ...(process.env.QA_CHROMIUM ? { executablePath: process.env.QA_CHROMIUM } : {}),
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
  const layout = await page.evaluate(() => {
    const de = document.documentElement;
    // The result screen scrolls inside its own container, not the document.
    // Content below the fold there is reachable, not broken - so only count
    // something as CLIPPED if scrolling cannot bring it into view.
    const scroller = [...document.querySelectorAll("div")].find(
      (d) => getComputedStyle(d).overflowY === "auto" && d.scrollHeight > d.clientHeight + 2
    );
    const reach = scroller ? scroller.scrollHeight - scroller.clientHeight : 0;
    const clipped = [];
    const belowFold = [];
    for (const el of document.querySelectorAll("button, h1, h2, p, img")) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const label = el.tagName.toLowerCase() + ":" + (el.textContent || "").trim().slice(0, 26);
      // A card hanging off the right edge of the recommendation rail is the
      // rail scrolling sideways on purpose, not a layout fault.
      const inSideScroller = el.closest(".rec-rail") !== null;
      if (!inSideScroller && (r.right > innerWidth + 1 || r.left < -1))
        clipped.push(label + " (horizontal)");
      else if (inSideScroller && r.right > innerWidth + 1) continue;
      else if (r.top < -1) clipped.push(label + " (above view)");
      else if (r.bottom > innerHeight + 1) {
        (r.bottom <= innerHeight + reach + 1 ? belowFold : clipped).push(label);
      }
    }
    const stage = document.querySelector(".result-scrim")?.getBoundingClientRect();
    return {
      horizontalScroll: de.scrollWidth > de.clientWidth,
      stageWidth: stage ? Math.round(stage.width) : null,
      viewportWidth: innerWidth,
      sideBandsPx: stage ? Math.round((innerWidth - stage.width) / 2) : null,
      clipped: clipped.slice(0, 6),
      belowFold: belowFold.slice(0, 6),
      scrollReachPx: reach,
    };
  });

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
  console.log(
    `[${label}] stage ${layout.stageWidth}px of ${layout.viewportWidth}px viewport` +
      ` | side bands ${layout.sideBandsPx}px | h-scroll ${layout.horizontalScroll}`
  );
  if (layout.clipped.length) console.log(`[${label}] CLIPPED (unreachable):`, layout.clipped);
  if (layout.belowFold.length)
    console.log(
      `[${label}] below fold, reachable by scrolling ${layout.scrollReachPx}px:`,
      layout.belowFold
    );
  if (errors.length) console.log(`[${label}] console errors:`, errors.slice(0, 5));

  await browser.close();
}

await run({ label: "result-BEFORE-old-scrim", oldScrim: true, width: 720, height: 1280 });
// The four screens this actually has to open on. A kiosk that only looks
// right at one aspect ratio is a kiosk that breaks in the room it gets
// demoed in.
const SCREENS = [
  { label: "phone-390x844", width: 390, height: 844 },
  { label: "kiosk-768x1024", width: 768, height: 1024 },
  { label: "laptop-1440x900", width: 1440, height: 900 },
  { label: "display-1920x1080", width: 1920, height: 1080 },
];
for (const s of SCREENS) await run({ ...s, oldScrim: false });
console.log("\ndone");
