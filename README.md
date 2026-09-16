# Kapadiya & Sons — the mirror

An AI fitting mirror for Indian couture. A customer stands in front of a
portrait screen, taps a garment, and sees herself wearing it — with her own
body, her own face, her own proportions.

Built from the Stitch design system (Atelier Nocturne) and the motion and
body-lock specs in `docs/`.

---

## It runs with no API key

Clone it, `npm install`, `npm run dev`, and the whole kiosk works end to end in
**demo mode** with pre-rendered looks. That is deliberate — you can show this on
a train with no wifi. Add a key and the same flow becomes real.

```bash
npm install
npm run dev          # http://localhost:3000
```

| Route | What it is |
|---|---|
| `/` | The kiosk. Attract → consent → mirror → countdown → result → compare → look book |
| `/shop` | Owner dashboard — today's numbers, the 30-day line, tried-but-not-sold |
| `/shop/collection` | The garment catalogue the rail reads from |
| `/shop/month` | The monthly report, built to be forwarded on WhatsApp |
| `/look/[id]` | What the QR code opens on a customer's phone. Expires in 15 minutes |
| `/api/health` | Whether a key is configured and which mode is live |

---

## Turning it real

One environment variable:

```
GEMINI_API_KEY=your_key_from_aistudio.google.com/apikey
```

That is the only required one. Two optional:

```
TRYON_MODE=premium               # or "simple"
GEMINI_IMAGE_MODEL=gemini-3.1-flash-image
```

**There is no free tier for image generation.** Google's image models are paid
from the first call. Budget roughly ₹3.70 per generated look.

---

## The two modes

`lib/gemini.js` implements both paths from the body-lock spec.

**`simple`** — one call. Temperature 0.15, fixed seed, and a prompt that lists
what must not change. Fast, cheap, right about 80% of the time.

**`premium`** (default) — three calls:

1. **Read the body.** Ask the model to describe her build factually, for a
   tailor. ~90 words. Cached per customer, so it costs once no matter how many
   garments she tries.
2. **Generate with that reading injected** as a requirement, not a hope. This
   is the whole trick — it converts "don't change the body," a negative
   instruction diffusion models handle badly, into "reproduce this specific
   body," which they handle well.
3. **Verify.** Send the result back with the description and ask whether they
   match. If not, regenerate once with the drift fed back in as a constraint.

Premium costs about ₹5.00 a look against ₹3.70. That ₹1.30 buys away the
failure that loses you the shop.

---

## Things worth knowing before you install one

**Cameras need HTTPS.** `getUserMedia` only runs on a secure origin.
`localhost` counts; a LAN IP does not. On Vercel you get HTTPS free. On a box
in the shop, use `localhost` on the kiosk itself.

**The QR hand-off is in memory.** `lib/store.js` holds generated looks for 15
minutes in a Map. On a kiosk running `next start` in the shop that is exact. On
serverless it is right most of the time but not all — swap those two functions
for Vercel Blob or S3 if you need it guaranteed.

**Nothing about a customer is stored.** The captured frame goes to the API and
is never written to disk. The consent screen says so because India's DPDP Act
2023 requires it, and because it is the best line in the whole kiosk.

**Sarees are the hard case.** A saree is six metres of unstitched drape with no
fixed shape to copy, so the model invents one. `lib/gemini.js` adds a specific
pallu-and-pleats clause for `kind: "saree"`. Test it on real stock before you
promise it to a shop.

---

## Changing the rail

`lib/garments.js`. Prices, names, sizes, images. A shop owner should be able to
change a price without a deploy — that file is the seam where a database goes
when the first shop signs.

---

## Motion

Three easing curves, five durations, in `app/globals.css`. Only ever animate
`transform`, `opacity` and `filter`. The result cross-fade is 1100ms and should
not be shortened — it is the moment the whole product exists for.

Full spec in `docs/06-motion-spec.md`.
