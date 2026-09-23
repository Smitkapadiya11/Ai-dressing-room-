# ASSET_PROMPTS.md — Kapadiya & Sons Visual Production Kit

> **Wiring status (code):** every path below is read by `lib/media.js` at build time. Drop a file at its exact path, commit, and redeploy. The slot switches from its code-native fallback to the real asset with no code change.
> The kit's component names (`Hero.tsx`, `Problem.tsx`, …) map to `components/home/Top.js` (Hero, Problem, Origin, Founder) and `components/home/Bottom.js` (Steps, Features, Honesty, System, Reasons, Closing). The project is JavaScript.
> **Wired:** H1–H3, P1–P4, O1–O3, F1 (done: real photo), S1–S3 (S3 carries the "Concept visualisation" caption, and so does the hero video), B1–B4, HN pair + honesty-bg, T1, W1, C1, K1 (auto-enabled when the file exists), G1.
> **Not wired yet:** F2 (the thread is drawn in CSS), K2 (the kiosk uses a CSS drape wipe), G2 (the OG image is generated in code by `app/opengraph-image.js`; delete that file to use `public/og-image.jpg` instead), and G3 (there is no `/contact` page; the enquiry form is at `/#contact`).
> Current layouts: Problem is numbered rows with a thumbnail rather than a 2×2 card grid, Features is a list with images rather than a bento grid, and Origin is a 3-column timeline with the image above the text.

**Tools:** Google Flow. Use **Veo** for videos and **Imagen** for stills.
**Where files go:** everything lives under `public/media/`. The paths below are exact.
**Section numbers** match the Claude Code prompt (3.1 = Hero, 3.2 = Problem, and so on).

---

## 0. READ THIS FIRST — 5 rules

1. **Paste the Style Block (Section 1) at the end of every prompt.** It keeps all assets looking like one shoot, not 25 random AI images.
2. **Veo does not make square videos.** Veo only outputs 16:9 or 9:16. For every 1:1 video below, generate at 16:9 with the subject centred, then crop to square (the command is in Section 7).
3. **Veo clips are about 8 seconds long.** For seamless loops, generate the clip, then use the loop trick in Section 7.
4. **Never AI-generate these three:**
   - the founder portrait,
   - the honesty before/after pair,
   - any "real customer result".

   Use real, consented photos for these. The site's core promise is "we show you as you are". If an investor finds out your honesty section uses AI-faked photos, the pitch is over. Shooting guides for all three are in Section 5.
5. **Label concept visuals.** Any AI video that shows a try-on result on the mirror screen gets a small caption on the site: *"Concept visualisation."* The code adds it with the prop `concept` on the `Clip` component.

Generate 3–4 variations of each prompt and keep the best. Reject any output with:
- extra fingers,
- warped text or fake logos,
- glamour-model faces,
- plastic skin.

---

## 1. STYLE BLOCK — append to every prompt

```
Style: cinematic editorial photography, shot on a full-frame camera with a 50mm prime lens, shallow depth of field, soft natural falloff. Warm tungsten and brass practical lighting mixed with soft daylight. Colour palette: deep charcoal and near-black shadows, warm ivory highlights, champagne-gold accents, rich textile colours (maroon, peacock teal, marigold, emerald) appearing only in the fabrics. Setting feels like a premium Indian textile showroom in Surat, Gujarat. Real, ordinary Indian people of varied ages, body sizes and skin tones — natural un-retouched skin, no glamour makeup, no fashion-model poses. Subtle film grain. Calm, slow, confident mood.
Avoid: text, letters, logos, brand names, watermarks, neon, purple or blue gradients, sci-fi holograms, futuristic HUD overlays, plastic skin, beauty filters, distorted hands, extra limbs, western mall interiors.
```

---

## 2. HOME PAGE `/` — asset by asset, in scroll order

### 3.1 HERO — first screen, top of the site

**H1 · Hero loop (desktop)**
- **Path:** `public/media/home/hero-loop.mp4` (plus `.webm`)
- **Position:** full-bleed background behind the headline, 100% width × 100vh. The headline and CTAs sit on the left, so keep the right side for the action. A dark gradient scrim runs from the left edge to 45%.
- **Spec:** Veo, 16:9, 1080p, 8s, no audio. Must loop.
- **Prompt:**
```
Slow cinematic dolly-in, camera gliding from left to right. Inside an elegant Indian saree showroom in the evening: dark wooden shelves stacked with folded silk sarees in maroon, gold and teal, warm brass lamps glowing. On the right third of the frame stands a tall slim floor-standing digital mirror kiosk with a thin matte-black frame and a fine champagne-gold edge. A real Indian woman in her late thirties with a fuller figure, wearing a simple cotton kurta, stands in front of it, and the portrait screen shows her wearing a deep maroon Banarasi silk saree with gold zari border, draped naturally on her real body. She turns slightly and smiles softly. Left half of the frame is darker and uncluttered with soft bokeh of shelves. Camera movement is smooth and continuous, ending at a composition similar to the start for looping.
```
+ Style Block

**H2 · Hero loop (mobile)**
- **Path:** `public/media/home/hero-loop-portrait.mp4` (plus `.webm`)
- **Position:** replaces H1 below 768px. The text overlays the bottom 40% on a dark scrim.
- **Spec:** Veo, 9:16, 1080p, 8s.
- **Prompt:**
```
Vertical composition. Slow push-in toward a tall matte-black digital mirror kiosk with a thin champagne-gold edge, standing in a warmly lit Indian saree showroom with shelves of folded silk behind. A real Indian woman in her late thirties with a fuller figure stands facing it; the mirror screen shows her wearing a maroon Banarasi silk saree with gold zari border, naturally draped on her real body shape. Top 60% of frame holds the mirror and woman, bottom 40% is darker floor and soft shadow, leaving space for text.
```
+ Style Block

**H3 · Hero poster (still)**
- **Path:** `public/media/home/hero-poster.jpg`
- **Position:** `poster` attribute of H1. It shows while the video loads and on slow networks.
- **How to make it:** don't generate it. Export the first frame of H1 (command in Section 7).

---

### 3.2 THE PROBLEM — four items

- **Spec for all four:** Imagen, 4:3, highest resolution. Each image has a 12px radius with a slight darken on hover.

**P1 · Unfolding sarees** → `public/media/home/problem-unfolding.jpg`
```
A traditional Surat saree shop counter with white gaddi cushions. A male shop assistant in his twenties unfolds yet another silk saree, surrounded by a messy pile of twenty half-opened sarees in many colours and plastic packets. Two women customers sit on the gaddi looking slightly overwhelmed. Warm overhead lighting, mild chaos, realistic small-business atmosphere, shot from a slightly high angle.
```
+ Style Block

**P2 · Trial-room queue** → `public/media/home/problem-trialroom.jpg`
```
Festival-season rush in an Indian clothing showroom: a narrow corridor with three curtained trial rooms, a queue of five customers holding hangers of kurtas and lehengas, some checking their phones impatiently, one mother with a restless child. Marigold festive decorations above. Realistic, candid documentary feel, eye-level shot.
```
+ Style Block

**P3 · "I'll think about it"** → `public/media/home/problem-leaving.jpg`
```
A young Indian woman walking out of a saree shop entrance onto a busy evening street, looking back over her shoulder with hesitation, empty-handed. Inside the shop behind her, a salesman stands at the counter with a lehenga still spread out. Warm shop light spilling onto the street, cool blue dusk outside, sense of a lost sale.
```
+ Style Block

**P4 · Stock nobody sees** → `public/media/home/problem-stockroom.jpg`
```
The back storeroom of an Indian textile shop: floor-to-ceiling steel racks packed with hundreds of sealed saree and lehenga packets, dust visible in a single beam of light from a small high window. No people. Quiet, slightly melancholic, conveys a large catalogue that customers never get to see.
```
+ Style Block

---

### 3.3 THE ORIGIN — 3 frames

- **Spec:** Imagen, 16:9.

**O1 · Where the idea came from** → `public/media/home/origin-china.jpg`
```
A modern minimalist apparel store in an East Asian city, white and pale wood interior, a large touchscreen smart mirror on a wall showing a shopper trying on a jacket virtually. A young East Asian shopper stands in front of it. Clean, bright, retail-tech atmosphere, no visible brand names or text anywhere.
```
+ Style Block, **with one change:** replace "Setting feels like a premium Indian textile showroom in Surat, Gujarat" with "Setting is a modern East Asian apparel store".

**O2 · The gap in Indian retail** → `public/media/home/origin-surat-market.jpg`
```
Wide shot of a bustling textile market street in Surat, Gujarat in late afternoon: rows of saree shops with colourful fabrics hanging at the entrances, shopkeepers, customers, scooters, hand-painted shop boards with no readable text. Golden hour light, dust in the air, vibrant but authentic, documentary style.
```
+ Style Block

**O3 · Building it** → `public/media/home/origin-workbench.jpg`
```
Night-time workspace of a young Indian software builder: a desk with a laptop showing abstract code (no readable text), a USB webcam clipped on a portrait monitor, a swatch of maroon silk fabric, a steel cup of chai, notebook with hand-drawn sketches of a mirror kiosk. Warm desk lamp, rest of room dark. No person visible, only hands resting on the keyboard.
```
+ Style Block

---

### 3.4 FOUNDER JOURNEY — gold thread timeline

**F1 · Founder portrait — REAL PHOTO, not AI** → `public/media/home/founder.jpg` ✅ in place (cropped to 4:5, 1200×1500).

**F2 · Thread texture (optional, not wired)** → `public/media/home/gold-thread.png`. Imagen, 9:16.
```
Extreme macro photograph of a single strand of metallic gold zari thread running perfectly vertically down the centre of the frame against a pure matte black background, fine twisted fibres visible, soft rim light. Minimalist, isolated.
```
+ Style Block

---

### 3.5 HOW IT WORKS — 3 steps, square videos

- **Spec for all three:** Veo, **generate at 16:9 with the subject centred**, 1080p, 6–8s. Crop to 1:1 afterwards (Section 7).
- **Behaviour:** autoplays muted when in view and pauses off screen. This is built in.

**S1 · Stand in front** → `public/media/home/step-1-scan.mp4` (+ `.webm`, + `step-1-poster.jpg`)
```
Centred composition. A middle-aged Indian man with a heavier build, wearing a plain shirt, steps in front of a tall matte-black digital mirror with a champagne-gold edge in a warm showroom. A soft thin line of warm golden light slowly sweeps from top to bottom across the mirror screen, gently indicating a scan. He stands naturally. Subject stays in the central square area of the frame. Slow, smooth, calm.
```
+ Style Block

**S2 · Pick from the catalogue** → `public/media/home/step-2-choose.mp4` (+ `.webm`, + `step-2-poster.jpg`)
```
Centred close-up of a hand swiping across a large vertical touchscreen mirror. On screen, a horizontal rail of garment thumbnails slides past: a maroon silk saree, an emerald lehenga, an ivory kurta, a teal dupatta, each on a dark background with thin gold borders, no text. Warm reflections on the glass. Subject in central square of frame.
```
+ Style Block

**S3 · See it on you** → `public/media/home/step-3-see.mp4` (+ `.webm`, + `step-3-poster.jpg`). Shows the "Concept visualisation" caption.
```
Centred composition. The mirror screen shows the same heavier-built middle-aged Indian man, but now wearing an ivory silk kurta with subtle gold embroidery, fitted naturally to his real body shape and size — not slimmed. The image on screen settles with a gentle fabric-like reveal from left to right. Then a small square QR-style pattern appears in the lower corner of the screen and a hand holding a smartphone enters the frame to scan it. Subject in central square of frame.
```
+ Style Block

---

### 3.6 FEATURES

**B1 · Your own catalogue** → `public/media/home/feature-catalogue.jpg` (Imagen, 4:3)
```
Over-the-shoulder shot of an Indian shop owner in his fifties, spectacles on, photographing a folded silk saree laid flat on a white counter with his smartphone, while a tablet beside him shows a neat grid of garment photos on a dark interface. Warm, practical, owner-in-control mood.
```
+ Style Block

**B2 · QR hand-off** → `public/media/home/feature-qr.jpg` (Imagen, 1:1)
```
Close-up of a woman's hand with bangles holding a smartphone, its screen showing a photo of her wearing a teal georgette saree. Blurred showroom lights in background. Shallow depth of field, focus on phone.
```
+ Style Block

**B3 · Floor or wall** → `public/media/home/feature-wall.jpg` (Imagen, 1:1)
```
A slim matte-black digital mirror screen with a fine champagne-gold edge mounted flat on a dark wooden wall between shelves of folded fabrics in a boutique, screen showing a softly lit garment. Straight-on architectural product photo, symmetrical.
```
+ Style Block

**B4 · Attract mode** → `public/media/home/feature-attract.jpg` (Imagen, 1:1)
```
Empty showroom at quiet hour, a tall digital mirror kiosk glowing softly and displaying an elegant slow-moving image of a draped emerald lehenga, drawing the eye of a passerby visible as a soft blurred figure near the entrance.
```
+ Style Block

---

### 3.7 THE HONESTY PROMISE

**HN1 / HN2 · REAL APP OUTPUT ONLY** → `public/media/home/honesty-before.jpg` and `public/media/home/honesty-after.jpg`. 3:4, minimum 1500×2000px. Both files must exist before either one shows. See Section 5.

**Background texture (optional)** → `public/media/home/honesty-bg.jpg` (Imagen, 16:9)
```
Soft-focus close-up of an antique full-length mirror with a thin brass frame in a dim room, reflecting only warm blurred light. Very dark, quiet, minimal, lots of empty negative space.
```
+ Style Block

---

### 3.8 NEXT-GEN COMBINATION

**T1 · Mirror product hero** → `public/media/home/mirror-product.png` (transparent background, preferred) or `mirror-product.jpg`. Imagen, 3:4. It sits above the animated diagram.
```
Studio product photograph of a tall, slim, floor-standing portrait digital kiosk mirror: matte black body, thin champagne-gold trim along the edges, a small discreet camera at the top centre, weighted base. Three-quarter angle view, pure dark charcoal seamless background, soft top light and a gentle gold rim light. Screen displays a softly lit abstract silk drape. Premium hardware product photography.
```
+ Style Block

---

### 3.9 WHY RETAILERS BUY IT

**W1 · Showroom wide** → `public/media/home/benefits-showroom.jpg`. Full-width background behind the six selling points, darkened to 72%. Imagen, 21:9 (or 16:9, cropped).
```
Wide interior of a calm, premium Indian ethnic-wear showroom during business hours: a family of three looking at a digital mirror kiosk together, a salesperson smiling nearby, neatly displayed lehengas on mannequins, warm brass lighting, polished stone floor. Happy but natural, nothing staged.
```
+ Style Block

---

### 3.12 FINAL CTA

**C1 · Silk macro loop** → `public/media/home/cta-silk.mp4` (+ `.webm`, + `cta-silk-poster.jpg`). Full-bleed background behind the closing section. Veo, 16:9, 1080p, 8s, loop.
```
Extreme macro, slow motion: deep maroon silk fabric rippling gently in soft air, a single gold zari border catching warm light as it moves. Very dark background, fabric fills the lower two-thirds, upper third falls into shadow for text. Hypnotic, elegant, seamless motion.
```
+ Style Block

---

## 3. KIOSK `/mirror`

**K1 · Attract loop** → `public/media/mirror/attract-loop.mp4` (+ `.webm`, + `attract-poster.jpg`). Full screen behind the brand mark and the "Touch to begin" ring; keep the bottom 25% calm. Veo, 9:16, 1080p, 8s, loop. It turns on automatically when the file exists at build.
```
Vertical. Slow elegant sequence on a black background: a maroon Banarasi silk saree unfurls and drapes itself in the air as if on an invisible figure, then softly dissolves into an emerald silk lehenga, then an ivory embroidered kurta, each garment glowing under warm gold rim light. Floating fine gold dust particles. Bottom quarter of the frame stays dark and empty. Luxurious, slow, seamless loop.
```
+ Style Block

**K2 · Result reveal overlay (optional, not wired; a CSS drape wipe is live)** → `public/media/mirror/drape-wipe.webm`. Veo, 9:16, 3–4s.
```
Vertical. A sheet of sheer champagne-gold chiffon fabric sweeps across the entire frame from left to right and flows out of the right edge, against a pure black background. Smooth, fast but graceful, 3 seconds.
```
+ Style Block

---

## 4. SITE-WIDE ASSETS

**G1 · Fabric grain overlay** → `public/media/global/fabric-grain.png`. Tiled over the home page at 5% opacity with `mix-blend-mode: overlay`. It replaces the CSS grain when present. Imagen, 1:1.
```
Seamless tileable texture of fine raw silk weave, extreme close-up, neutral mid-grey, even lighting, no shadows, no folds, flat and uniform.
```
(No Style Block for this one.)

**G2 · Social share image** → `public/og-image.jpg`, exactly 1200×630. The site currently generates a designed OG card in code. To use this image instead, delete `app/opengraph-image.js` and add `images: ["/og-image.jpg"]` to the `openGraph` metadata in `app/page.js`. **Never let AI generate the text.**
```
Dark cinematic banner: a tall matte-black digital mirror with thin gold edge on the right side, reflecting a draped maroon silk saree, deep charcoal background, warm gold light, large empty dark area on the left half for text.
```
+ Style Block

**G3 · Contact page image** → `public/media/contact/contact-side.jpg`. This needs a `/contact` page, which isn't built yet; the form currently lives at `/#contact`. Imagen, 3:4.
```
A shop owner and a young consultant shaking hands across a wooden counter in a warm saree showroom, a digital mirror kiosk softly lit in the background. Genuine, respectful, local-business feel.
```
+ Style Block

---

## 5. REAL PHOTOS YOU MUST SHOOT (do not generate)

### Founder portrait → `public/media/home/founder.jpg` ✅ done

### Honesty before/after → `honesty-before.jpg` / `honesty-after.jpg`
1. Get a volunteer with an ordinary build who is not model-like — ideally a heavier person, a family member or a friend. Get **written consent** (a signed WhatsApp message is enough) that the photo can appear on the website.
2. Take the "before" photo with **the kiosk camera itself**, in the shop lighting.
3. Run it through the **new try-on prompt** with a saree from your real catalogue. That output is your "after".
4. Do not edit either image. If the output slims or lightens them, the prompt isn't fixed yet, so don't publish.
5. This pair doubles as proof for your investor that the "no makeup, no slimming" problem is solved.

### Real kiosk photos (replace AI shots later)
Once the mirror is in a real shop, re-shoot H1, T1 and B3 with the actual hardware.

---

## 6. MASTER CHECKLIST

| # | File | Section | Type | Ratio | Wired |
|---|------|---------|------|-------|-------|
| H1 | `public/media/home/hero-loop.mp4` | Hero bg | Veo | 16:9 | ✅ |
| H2 | `public/media/home/hero-loop-portrait.mp4` | Hero mobile | Veo | 9:16 | ✅ |
| H3 | `public/media/home/hero-poster.jpg` | Hero poster | frame export | 16:9 | ✅ |
| P1–P4 | `public/media/home/problem-*.jpg` | Problem | Imagen | 4:3 | ✅ |
| O1–O3 | `public/media/home/origin-*.jpg` | Origin | Imagen | 16:9 | ✅ |
| F1 | `public/media/home/founder.jpg` | Founder | **REAL PHOTO** | 4:5 | ✅ in place |
| F2 | `public/media/home/gold-thread.png` | Founder timeline | Imagen (optional) | 9:16 | — |
| S1–S3 | `public/media/home/step-*.mp4` | How it works | Veo → crop | 1:1 | ✅ |
| B1–B4 | `public/media/home/feature-*.jpg` | Features | Imagen | 4:3 / 1:1 | ✅ |
| HN | `public/media/home/honesty-before.jpg` / `-after.jpg` | Honesty | **REAL APP OUTPUT** | 3:4 | ✅ |
| T1 | `public/media/home/mirror-product.(png|jpg)` | Technology | Imagen | 3:4 | ✅ |
| W1 | `public/media/home/benefits-showroom.jpg` | Selling points bg | Imagen | 21:9 | ✅ |
| C1 | `public/media/home/cta-silk.mp4` | Final CTA bg | Veo | 16:9 | ✅ |
| K1 | `public/media/mirror/attract-loop.mp4` | `/mirror` attract | Veo | 9:16 | ✅ auto |
| K2 | `public/media/mirror/drape-wipe.webm` | `/mirror` reveal | Veo (optional) | 9:16 | — |
| G1 | `public/media/global/fabric-grain.png` | Overlay | Imagen | 1:1 tile | ✅ |
| G2 | `public/og-image.jpg` | Share preview | Imagen + text | 1200×630 | manual (see G2) |
| G3 | `public/media/contact/contact-side.jpg` | `/contact` | Imagen | 3:4 | — |

**Minimum set to launch:** H1, H2, S1–S3, T1, K1, G2, plus the real HN pair. Everything else has a code fallback.

---

## 7. AFTER DOWNLOADING — compress and prepare

Install ffmpeg first (`winget install ffmpeg` on Windows). Then run these from the folder holding the raw files.

**Compress a video to web MP4 + WebM (target under 3 MB):**
```bash
ffmpeg -i raw.mp4 -an -vf "scale=1920:-2" -c:v libx264 -crf 26 -preset slow -movflags +faststart hero-loop.mp4
ffmpeg -i raw.mp4 -an -vf "scale=1920:-2" -c:v libvpx-vp9 -crf 36 -b:v 0 hero-loop.webm
```
For 9:16 files, use `scale=-2:1920`. For 1:1 files, use `scale=1080:1080`.

**Crop a 16:9 Veo clip to a centred square (for S1–S3):**
```bash
ffmpeg -i raw.mp4 -an -vf "crop=ih:ih,scale=1080:1080" -c:v libx264 -crf 26 -movflags +faststart step-1-scan.mp4
```

**Make a seamless loop (plays forward then backward, so there's no jump):**
```bash
ffmpeg -i raw.mp4 -filter_complex "[0:v]reverse[r];[0:v][r]concat=n=2:v=1[v]" -map "[v]" -an looped.mp4
```
Use this for C1 and K1. For H1, only use it if the camera move looks natural in reverse.

**Export a poster frame:**
```bash
ffmpeg -i hero-loop.mp4 -frames:v 1 -q:v 3 hero-poster.jpg
```

**Compress stills:** export JPGs at 2400px on the long edge and 80% quality (the site serves images as-is, so keep them small).

**Last step:** put every file at its exact path, commit, and redeploy. The slots switch over by themselves.
