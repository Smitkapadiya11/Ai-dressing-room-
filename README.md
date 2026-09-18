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
| `/api/health` | Whether a key is configured for the active `PROVIDER`, plus `provider`/`tier` |
| `/api/body-read`, `/api/tryon`, `/api/verify`, `/api/share` | The engine — see below |

---

## Turning it real — provider-agnostic

`lib/imagegen.js` is the one function everything calls: `generate()`. It
dispatches to `lib/providers/openai.js` or `lib/providers/gemini.js` based on
`PROVIDER`. Switching providers is that one env var — nothing else in the app
knows or cares which one is live.

```bash
PROVIDER=openai            # or "gemini" — the default
RESULT_TIER=test           # or "demo", see the cost table below
OPENAI_API_KEY=...         # if PROVIDER=openai
GEMINI_API_KEY=...         # if PROVIDER=gemini
```

**There is no free tier on either provider.** Before picking one, run the
bakeoff — Rs 12, ten minutes, and it settles the question better than any
published benchmark:

```bash
OPENAI_API_KEY=xxx GEMINI_API_KEY=yyy \
  node scripts/bakeoff.mjs ./photo-of-you.jpg ./public/catalogue/some-garment.jpg
```

Writes `bakeoff/openai.jpg` and `bakeoff/gemini.jpg` (gitignored). Look at
your own face in both, then set `PROVIDER` to whichever wins.

If you land on Gemini, also run `node scripts/probe-gemini.mjs` once — Google
currently has two live request shapes for image generation and the wrong one
fails quietly. It tells you which one to set `GEMINI_API_SHAPE` to (`A`, the
classic `generateContent` shape, is the default if unset).

**One aspect-ratio catch:** OpenAI's portrait output is 1024×1536 (2:3), not
9:16. The result screen is already full-bleed `object-fit: cover`, so this is
a non-issue in the UI — it just centre-crops, which usually improves the
framing since the subject is centred. Gemini returns true 9:16 natively.

## Cost per fitting

One generated look is **three API calls**, but the customer only ever waits
for one of them — the other two run in the background, before and after she
sees the picture (see "the two timing tricks" in `lib/engine.js` and
`components/Kiosk.js`).

| Call | When | Cost |
|---|---|---|
| Body read | In the background, the instant the shutter fires | ₹0.20 |
| Generate | While she chooses a garment, this is what she waits for | see below |
| Verify | In the background, after the result is already on screen | ₹0.20 |

Generate, by provider and tier (`RESULT_TIER`):

| Provider | test | demo |
|---|---|---|
| OpenAI (default) | gpt-image-1-mini, medium, **≈₹3.16** | gpt-image-2.5 → gpt-image-2 → gpt-image-1.5, medium, **≈₹15.68** |
| Gemini | 512px, **₹4.30** | 1K, **₹6.41** |

**The OpenAI figures are estimates, not confirmed against a real usage
dashboard.** OpenAI publishes per-size/quality prices for plain text-to-image
(1024×1536 medium ≈ ₹3.92), but this flow sends **two reference images**
(her photo + the garment) through `images/edits`, and reference images are
billed as extra image-input tokens on top of that. A field-measured example
(OpenAI, Sep 2026) showed a plain low-quality call at $0.0063 vs. the same
call with two reference images at $0.025 — roughly 4×. The table above
applies that ratio (a smaller ~2× for the cheaper mini model, since its own
edit-token rate isn't published anywhere). See the comment above
`COST_INR_BY_TIER` in `lib/providers/openai.js`. **Run 5–10 real fittings
and check your OpenAI dashboard's Usage page — that's ground truth, this is
a bridge until then.** Note this also means OpenAI's `demo` tier is not
obviously cheaper than Gemini once reference images are counted — the
bakeoff should weigh cost alongside quality, not assume OpenAI wins on price.

`high` quality is available (`OPENAI_IMAGE_QUALITY_DEMO=high`) but is **not**
the `demo` default — at OpenAI's published rates it runs roughly 4× medium,
which is too expensive for a tier default. Use it only for a final
warm-the-cache pass on the handful of garments you're actually demoing.

All in, OpenAI at `demo` tier is roughly **₹16.08 a fitting** (body read +
generate + verify); at `test` tier roughly **₹3.56**. Run `test` for every
iteration while tuning the flow; switch to `demo` — or warm the cache at
`high` for just the pieces you're showing — before anyone important stands
in front of it. A repeat of the same photo through the same garment,
colourway, provider and tier is **free** — see the cache below.
`.data/fittings.jsonl` (gitignored) logs every run — time, garment,
provider, tier, ms, cost, whether it was a cache hit — so you can read the
real per-customer cost back out instead of guessing, and correct the
estimates above once you have real numbers.

## The cache

`lib/cache.js`. Before calling out, the generate step hashes
`sha256(personJpegBytes + garmentId + colourway + PROVIDER + RESULT_TIER)`
and checks `.data/cache/<hash>.jpg`. A hit returns instantly, for free, with
no network call at all — which is also your insurance against the shop wifi
dying mid-pitch. Before a demo or a meeting, warm the cache by running the
garments you intend to show, on a photo of yourself, once each at the `demo`
tier.

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
npm install sharp   # one-time — not in package.json, this script only runs locally
node scripts/prep-photos.mjs ./raw-photos
```

It centre-crops to 3:4, resizes to 1024 on the long edge, normalises exposure,
and writes `public/catalogue/<id>.jpg`. **Commit these** — the try-on API
reads garment photos straight off the server's filesystem at request time
(`app/api/tryon/route.js`), and Vercel only deploys what's actually in git,
so an uncommitted `public/catalogue/` means every garment fails with "No
photo yet" in production, key or no key. It prints which ids are still
missing.

For anything still missing — a garment not yet in stock, a photo that didn't
come out — generate it instead, using whichever `PROVIDER` is set (cheapest
is OpenAI's gpt-image-1-mini at about ₹1.58; Gemini is about ₹4.30–6.41):

```bash
PROVIDER=openai OPENAI_API_KEY=xxx node scripts/build-catalogue.mjs
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
