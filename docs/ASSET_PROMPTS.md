# Asset shot list — Google Flow (Veo for video, Imagen for stills)

Put finished files in `public/media/`. Every slot already has a code-native fallback, so the site works before any of these exist.

**Rules for every prompt with people:** realistic Indian customers of varied body sizes, ages and skin tones. A natural, un-retouched look with visible skin texture. No model-like glamour, no fashion-shoot styling. No brand logos, no celebrities, no readable signage.

**Delivery:** export video as both `.mp4` (H.264) and `.webm` (VP9). Keep each hero loop under 3 MB (1080p, ~2 Mbps, no audio track). Export a `-poster.jpg` from frame 1 of every video. Make loops seamless, with the first and last frame matching.

| File | Used on | Aspect | Length | Resolution |
|---|---|---|---|---|
| `hero-loop.mp4` / `.webm` | `/` hero, desktop | 16:9 | 8–10 s loop | 1920×1080 |
| `hero-loop-portrait.mp4` / `.webm` | `/` hero, mobile | 9:16 | 8–10 s loop | 1080×1920 |
| `step-1-scan.mp4` | How it works, step 1 | 1:1 | 4–6 s loop | 1080×1080 |
| `step-2-choose.mp4` | How it works, step 2 | 1:1 | 4–6 s loop | 1080×1080 |
| `step-3-see.mp4` | How it works, step 3 | 1:1 | 4–6 s loop | 1080×1080 |
| `attract-loop.mp4` | `/mirror` attract screen (set `NEXT_PUBLIC_ATTRACT_VIDEO=1`) | 9:16 | 10–15 s loop | 1080×1920 |
| `problem-trialroom.jpg` | Problem section | 3:2 | — | 2400×1600 |
| `problem-unfolding.jpg` | Problem section | 3:2 | — | 2400×1600 |
| `origin-china.jpg` | Origin timeline | 4:3 | — | 2000×1500 |
| `mirror-product.jpg` | Hero poster / OG | 4:5 | — | 1600×2000 |
| `founder.jpg` | Founder section (real photo, not generated) | 4:5 | — | 1200×1500 |
| `honesty-before.jpg` / `honesty-after.jpg` | Honesty section. **Real, consented demo photos from the app only. Never generated.** | 3:4 | — | 1200×1600 |

## Prompts

### hero-loop (16:9) and hero-loop-portrait (9:16)
> Slow, steady cinematic dolly-in, 35mm lens, shallow depth of field. Inside an upscale saree showroom in Surat, India: warm tungsten lighting, polished wooden gaddi counter, shelves of folded silk sarees in deep reds, greens and golds. At the centre stands a floor-standing smart mirror: a tall portrait touchscreen in a slim matte-black frame with a thin champagne-gold edge. An ordinary Indian woman in her late thirties, average-to-full build, medium-brown skin, natural un-retouched face, simple cotton kurta, looks at the screen. On the screen she sees herself, same face and same body, wearing a deep wine Banarasi silk saree with gold zari border. She tilts her head slightly and smiles, a small, genuine reaction. Real, documentary feel, natural skin texture, no glamour, no makeup look, no logos, no readable text. Seamless loop: the final frame matches the first.

For the portrait version, use the same prompt but frame her and the mirror vertically, with the mirror filling the upper two-thirds.

### step-1-scan (1:1)
> Close, eye-level shot of a smart mirror's black-framed portrait screen in a warm-lit clothing shop. A middle-aged Indian man, heavier build, wheatish skin, everyday shirt, stands still in front of it. A thin horizontal line of soft gold light sweeps slowly down the screen over his reflection, top to bottom, once. Calm, precise, no sci-fi effects, no HUD text. Seamless 5-second loop.

### step-2-choose (1:1)
> Over-the-shoulder shot of a young Indian woman's hand (dark skin, a few glass bangles) swiping slowly through a horizontal rail of garment cards on a portrait touchscreen: a red saree, a green lehenga, a cream kurta. Each card slides with a soft ease. Warm showroom bokeh behind. No readable text on the screen, no logos. Seamless 5-second loop.

### step-3-see (1:1)
> A portrait touchscreen shows an older Indian woman in her sixties, grey hair in a bun, full build, dark-brown skin, reading glasses. Her image transitions with a slow top-to-bottom fabric-like wipe from her everyday cotton saree to an emerald silk saree with a gold border. Her face, body and skin stay exactly the same; only the clothing changes. Warm shop light, documentary realism. Seamless 5-second loop.

### attract-loop (9:16)
> Vertical, slow, elegant loop for a shop mirror's idle screen. Close-up, macro-detail shots of Indian textiles dissolve softly into one another: gold zari on wine silk, a lehenga's mirror-work, the pleats of a cotton saree, a bandhgala's buttons. Very slow camera drift, warm light, deep blacks around the edges so white text stays readable in the lower third. No people, no text, no logos. Seamless 12-second loop.

### problem-trialroom.jpg
> Documentary photo inside a busy Indian clothing store during festival season: marigold decorations, a short queue of ordinary customers of mixed ages and body types waiting outside two curtained trial rooms, some holding folded garments, one checking her phone. Warm, slightly crowded, candid, natural colour. No logos, no readable signage, no staged smiles.

### problem-unfolding.jpg
> Documentary photo from behind a traditional white-cushioned gaddi counter in a Surat saree shop. A shop assistant in his twenties unfolds a silk saree with a practised flick while a tall stack of already-opened sarees and torn plastic packets builds up beside him. Two customers sit on the gaddi watching. Warm light, candid, natural. No logos.

### origin-china.jpg
> Modern apparel store in a Chinese city, clean minimal interior, white and light-wood fixtures. A tall, unbranded portrait touchscreen "fitting mirror" with a small camera at the top shows a shopper's reflection wearing a different jacket from the one she has on. Slightly stylised editorial photography, soft daylight. No brand logos, no readable text in any language.

### mirror-product.jpg
> Clean product photograph of a floor-standing smart mirror kiosk: a tall portrait touchscreen in a slim matte-black frame with a thin champagne-gold inner edge and a small camera at the top centre, standing on a dark stone plinth. The background is a softly lit deep charcoal wall with a faint woven-fabric texture. The screen shows a gentle gold glow. Three-quarter angle, studio lighting, no logos, no text.
