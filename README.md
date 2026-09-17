# Kapadiya & Sons — the mirror

An AI fitting mirror for Indian couture. A customer stands in front of a
portrait screen, taps a garment, and sees herself wearing it — with her own
body, her own face, her own proportions.

```bash
npm install
npm run dev          # http://localhost:3000
```

The whole journey is one state machine in `components/Kiosk.js`:

```
poster -> welcome -> countdown -> drawer -> working -> result -> (drawer)
```

Read that file top to bottom to understand the product in two minutes. 90
seconds of no touch, anywhere, returns to the Poster and clears the session —
a fresh customer must never see the last one's reading.

---

## Routes

| Route | What it is |
|---|---|
| `/` | The kiosk — the whole journey above |
| `/look/[id]` | What the QR code on the result screen opens on a customer's phone. Expires in 15 minutes |
| `/api/health` | Whether `GEMINI_API_KEY` is configured |
| `/api/body-read`, `/api/tryon`, `/api/verify`, `/api/share` | The engine — see below |

---

## Turning it real

Two environment variables, one required:

```bash
GEMINI_API_KEY=your_key_from_aistudio.google.com/apikey   # required
GEMINI_API_SHAPE=A                                          # A or B, see below
RESULT_SIZE=1K                                               # 512px | 1K | 2K
```

**There is no free tier for image generation.** Google's image models are paid
from the first call. Run `node scripts/probe-gemini.mjs` once, with a real
key, before you build against this — Google currently has two live request
shapes for image generation and the wrong one fails quietly. The probe costs
about ₹6 and tells you which one to set `GEMINI_API_SHAPE` to (`A`, the
classic `generateContent` shape, is the default if you leave it unset).

## Cost per fitting

One generated look is **three API calls**, but the customer only ever waits
for one of them — the other two run in the background, before and after she
sees the picture (see "the two timing tricks" in `lib/gemini.js` and
`components/Kiosk.js`).

| Call | When | Cost |
|---|---|---|
| Body read | In the background, the instant the shutter fires | ₹0.10 |
| Generate | While she chooses a garment, this is what she waits for | ₹4.30 (512px) / **₹6.41 (1K, ship on this)** / ₹9.66 (2K) |
| Verify | In the background, after the result is already on screen | ₹0.10 |

**≈ ₹6.61 per fitting** at the shipped default (1K). A repeat of the same
photo through the same garment and colourway is **free** — see the cache
below. `.data/fittings.jsonl` (gitignored) logs every run — time, garment,
ms, cost, whether it was a cache hit — so you can read the real per-customer
cost back out instead of guessing.

## The cache

`lib/cache.js`. Before calling Gemini, the generate step hashes
`sha256(personJpegBytes + garmentId + colourway + RESULT_SIZE)` and checks
`.data/cache/<hash>.jpg`. A hit returns instantly, for free, with no network
call at all — which is also your insurance against the shop wifi dying
mid-pitch. Before a demo or a meeting, warm the cache by running the garments
you intend to show, on a photo of yourself, once each.

---

## Photographing the catalogue — Rs 0 if you do it yourself

`lib/catalogue.js` lists 14 garments, one photograph each, five colourways
each. The colourway is a sentence in the try-on prompt at generation time
("recoloured to deep wine #6E2639"), not a second photograph — that is what
turns 14 files into 70 combinations for nothing.

Ten minutes, a phone, and a plain wall gets you all fourteen for free:

- Plain light wall, garment hung flat.
- Whole garment in frame, with a hand's width of wall on every side.
- Daylight from a window to one side. No flash.
- Phone held level, at the garment's middle.
- Portrait orientation.

Name each photo `<garment-id>.jpg` (the ids are in `lib/catalogue.js`), put
them all in one folder, then:

```bash
node scripts/prep-photos.mjs ./raw-photos
```

It centre-crops to 3:4, resizes to 1024 on the long edge, normalises exposure,
and writes `public/catalogue/<id>.jpg` (gitignored — these are the shop's own
inventory photos, not code). It prints which ids are still missing.

For anything still missing — a garment not yet in stock, a photo that didn't
come out — generate it instead, at about ₹6.41 each:

```bash
GEMINI_API_KEY=xxx node scripts/build-catalogue.mjs
```

It only generates the ids `prep-photos.mjs` reported missing, skips anything
already in `public/catalogue`, and stops on the first API error instead of
burning credit in a loop.

---

## Changing the rail

`lib/catalogue.js`. Prices, names, fabrics, colourways, images. A shop owner
should be able to change a price without a deploy — that file is the seam
where a database goes when the first shop signs.

---

## The shell

`.stage` and `.panel` in `app/globals.css`. `.panel` is `aspect-ratio: 9/16`
with `container-type: size`, so every size inside it is written in `cqw`
(1cqw = 1% of the panel's width). One set of numbers renders identically on a
phone, a laptop and a portrait totem — no JavaScript sizing, no breakpoints.

## The Poster

`components/Poster.js`. One component, two modes: `idle` is the screensaver,
`working` is the loading screen, driven by real status text while a look
generates. The idle block drifts on a 40s loop (90s outside shop hours) so a
totem showing a static wordmark for eight hours a day doesn't burn it into
the panel — see the comment in the file before removing that.

## Recommendations

`lib/recommend.js`. Two rules, not a scoring engine: keep garments with a
colourway matching one of the three colours the body read suggested, drop
anything in the same category she just tried, take the first four. Every one
carries the same four-word reason — "Suits your colouring" — because a
recommendation with a visible reason reads as intelligence.

## Motion

Three easing curves, five durations, in `app/globals.css`. Only ever animate
`transform`, `opacity` and `filter` — nothing that triggers layout. The
result cross-fade (`.hero-in` / `.hero-out`) is 1100ms and should not be
shortened; it is the moment the whole product exists for.

## QA before you ship

```bash
npm run build
npm run start &
node scripts/qa.mjs
```

Drives the whole flow at phone, laptop and totem sizes with a fake camera and
a mocked API (so it costs nothing and needs no key), screenshots every state
into `qa-screenshots/` (gitignored — look at every one yourself), and fails
on any console error.
