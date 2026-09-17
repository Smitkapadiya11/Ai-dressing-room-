#!/usr/bin/env node
// Drives the whole flow — poster, welcome, countdown, capture, drawer,
// colourway, pick, working, result, compare, a recommendation, second
// result — at all three viewports, screenshots every state, and fails
// on any console error. /api/tryon, /api/body-read and /api/verify are
// mocked so this costs nothing and needs no GEMINI_API_KEY; /api/share
// hits the real (free, no-Gemini) route so the QR code is genuine.
//
//   npm run dev &   (or npm run start, on port 3000)
//   node scripts/qa.mjs

import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const BASE_URL = process.env.QA_URL || "http://localhost:3000";
const OUT = path.resolve("qa-screenshots");
mkdirSync(OUT, { recursive: true });

const SIZES = [
  { name: "phone", width: 390, height: 844 },
  { name: "laptop", width: 1440, height: 900 },
  { name: "totem", width: 1080, height: 1920 },
];

// A real, tiny, valid JPEG — content doesn't matter, only that decoding
// and displaying it doesn't throw.
const MOCK_JPEG_B64 =
  "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLFRcVEg8UHR0eGxsdGxseHiMoISUiIx0kJSUeICUlJSUlJSUlJSUlJSUlJSUlJf/bAEMBCQkJDAsMFAwMFBUPDxQVFxgYGBgVFxcYGBgYFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxf/wAARCAAIAAgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwCf/9k=";
const MOCK_IMAGE = `data:image/jpeg;base64,${MOCK_JPEG_B64}`;

async function mockApi(page) {
  await page.route("**/api/body-read", (route) =>
    route.fulfill({
      json: {
        bodyRead:
          "Average height.\nShoulders slightly broader than hips.\nAverage build.\nBest-fitting size: M\nThree garment colours: Champagne Gold, Ivory Cream, Deep Wine",
        recommendedSize: "M",
        suggestedColours: ["Champagne Gold", "Ivory Cream", "Deep Wine"],
        ms: 900,
        costInr: 0.1,
      },
    })
  );
  await page.route("**/api/tryon", async (route) => {
    await new Promise((r) => setTimeout(r, 1500));
    route.fulfill({
      json: {
        image: MOCK_IMAGE,
        bodyRead: "mock body read",
        recommendedSize: "M",
        suggestedColours: ["Champagne Gold", "Ivory Cream", "Deep Wine"],
        ms: 1500,
        costInr: 6.41,
      },
    });
  });
  await page.route("**/api/verify", async (route) => {
    await new Promise((r) => setTimeout(r, 300));
    route.fulfill({ json: { match: true, drift: "", costInr: 0.1 } });
  });
}

async function checkNoHorizontalScroll(page, label) {
  const overflowing = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
  );
  if (overflowing) throw new Error(`Horizontal scroll detected at "${label}"`);
}

async function checkTapTargets(page, label) {
  const small = await page.evaluate(() => {
    const els = document.querySelectorAll("button, a, input, label");
    const bad = [];
    for (const el of els) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue; // not rendered
      if (r.height < 44 || r.width < 44) {
        bad.push({ tag: el.tagName, text: (el.textContent || "").trim().slice(0, 30), w: r.width, h: r.height });
      }
    }
    return bad;
  });
  if (small.length > 0) {
    console.warn(`  ! tap target(s) under 44px at "${label}":`, small);
  }
}

async function run() {
  const browser = await chromium.launch({
    executablePath: process.env.QA_CHROMIUM_PATH || undefined,
    args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
  });

  let totalErrors = 0;

  for (const size of SIZES) {
    console.log(`\n=== ${size.name} (${size.width}x${size.height}) ===`);
    const context = await browser.newContext({
      viewport: { width: size.width, height: size.height },
      permissions: ["camera"],
    });
    const page = await context.newPage();

    const consoleErrors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => consoleErrors.push(String(err)));

    await mockApi(page);

    const shot = async (label) => {
      await checkNoHorizontalScroll(page, label);
      await page.screenshot({ path: path.join(OUT, `${label}-${size.name}.png`) });
      console.log(`  ✓ ${label}`);
    };

    // poster (idle)
    await page.goto(BASE_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await shot("poster");

    // welcome
    await page.mouse.click(size.width / 2, size.height / 2);
    await page.waitForTimeout(2200);
    await shot("welcome");
    if (size.name === "phone") await checkTapTargets(page, "welcome");

    // countdown (camera permission + numerals ticking)
    await page.getByText("Try it on yourself").click();
    await page.waitForTimeout(1800); // camera ready, a numeral or two in
    await shot("countdown");

    // let the countdown finish -> capture -> drawer rises
    await page.waitForTimeout(4000);
    await shot("drawer");
    if (size.name === "phone") await checkTapTargets(page, "drawer");

    // expand a card to see the colourway dots
    const firstCard = page.locator(".drawer-card").first();
    await firstCard.click();
    await page.waitForTimeout(500);
    await shot("colourway");
    if (size.name === "phone") await checkTapTargets(page, "colourway");

    // pick a colourway, then tap "See it on me"
    const dots = firstCard.locator(".colourway-dot");
    if ((await dots.count()) > 2) await dots.nth(2).click();
    await page.waitForTimeout(200);
    await firstCard.getByText("See it on me").click();
    await page.waitForTimeout(400);
    await shot("working");

    // result
    await page.waitForTimeout(1600);
    await shot("result");
    if (size.name === "phone") await checkTapTargets(page, "result");

    // compare
    await page.getByText("Compare").click();
    await page.waitForTimeout(300);
    await shot("compare");

    // tap a recommendation -> runs the pipeline again
    const rec = page.locator(".rec-card").first();
    if ((await rec.count()) > 0) {
      await rec.scrollIntoViewIfNeeded();
      await rec.click();
      await page.waitForTimeout(400);
      await shot("recommendation-working");
      await page.waitForTimeout(1600);
      await shot("second-result");
    } else {
      console.warn("  ! no recommendations rendered — check lib/recommend.js");
    }

    if (consoleErrors.length > 0) {
      console.error(`  ✗ console errors at ${size.name}:`);
      for (const e of consoleErrors) console.error(`    ${e}`);
      totalErrors += consoleErrors.length;
    }

    await context.close();
  }

  await browser.close();

  console.log(`\nScreenshots written to ${OUT}`);
  if (totalErrors > 0) {
    console.error(`\n${totalErrors} console error(s) — look at the screenshots and fix before shipping.`);
    process.exit(1);
  }
  console.log("\nNo console errors. Look at every screenshot before shipping.");
}

run();
