# Kapadiya & Sons — the mirror

An AI fitting mirror for Indian couture. A customer stands in front of a
portrait screen, taps a garment, and sees herself wearing it — with her own
body, her own face, her own proportions.

This build is going up in three passes. Pass 1 (this one) is the Poster and
the shell — the resting screen, the loading screen, and the container-query
layout that runs unchanged on a phone, a laptop and a portrait kiosk totem.
Camera capture, the try-on call, and the result screen come in later passes.

```bash
npm install
npm run dev          # http://localhost:3000
```

| Route | What it is |
|---|---|
| `/` | Poster (idle screensaver) → tap or key press → welcome screen |

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
and writes `public/catalogue/<id>.jpg`. It prints which ids are still missing.

For anything still missing — a garment not yet in stock, a photo that didn't
come out — generate it instead, at about ₹6.41 each:

```bash
GEMINI_API_KEY=xxx node scripts/build-catalogue.mjs
```

It only generates the ids `prep-photos.mjs` reported missing, skips anything
already in `public/catalogue`, and stops on the first API error instead of
burning credit in a loop.

---

## Turning the try-on real (coming in pass 2)

One environment variable, when that pass lands:

```
GEMINI_API_KEY=your_key_from_aistudio.google.com/apikey
```

**There is no free tier for image generation.** Google's image models are paid
from the first call.

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
`working` is the loading screen pass 2 will drive with real status text. The
idle block drifts on a 40s loop (90s outside shop hours) so a totem showing a
static wordmark for eight hours a day doesn't burn it into the panel — see the
comment in the file before removing that.

## Motion

Three easing curves, five durations, in `app/globals.css`. Only ever animate
`transform`, `opacity` and `filter`.
