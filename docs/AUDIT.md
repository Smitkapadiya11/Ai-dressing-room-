# Audit — before the landing-v2 rebuild

## What exists
- **Framework:** Next.js 15 App Router, React 19, Tailwind 3. Plain JavaScript (not TypeScript).
- **Routes:** `/` = the kiosk (`components/Kiosk.js`). `/look/[id]` = the phone page opened from the QR.
- **API:** `/api/tryon` (generate), `/api/body-read` (Pass A: a factual build description), `/api/verify` (Pass C: checks the result against the build description, runs after the result is on screen), `/api/share` (uploads the result to Vercel Blob; the link expires after 15 min), `/api/health`.
- **Providers:** `lib/imagegen.js` picks between `lib/providers/openai.js` (images/edits) and `lib/providers/gemini.js` by setting `PROVIDER`. There is no fal and no self-hosted Qwen endpoint in the repo.
- **Prompt:** one builder, `buildGeneratePrompt` in `lib/engine.js`, shared by both providers. Images are already sent in the order person, then garment.
- **Kiosk flow:** poster (idle attract) → welcome → camera → drawer (garment rail) → countdown → capture → result → QR → idle reset (`SHOP.idleReturnMs`).
- **Design:** the black and champagne tokens live in `tailwind.config.js`. Playfair Display and Manrope are self-hosted through `@fontsource`. The motion curves are in `app/globals.css`.

## Reusable as-is
Kiosk logic, the provider adapters, the catalogue, the share and Blob flow, the colour tokens and the fonts.

## Weak
- The home page *is* the kiosk, so nothing explains the product to a retailer or an investor.
- The root layout sets `select-none` and `maximumScale: 1` for every route. That suits a kiosk and hurts a marketing page.
- The try-on prompt is good, but it doesn't forbid makeup or skin lightening, and it doesn't say that the garment is sized to the body.

## Decisions (phase 1)
- **Staying on JavaScript.** Converting the working kiosk to TypeScript carries risk and doesn't help the customer. New content lives in `content/*.js`.
- **No Lenis or GSAP yet.** The reveals use IntersectionObserver with CSS transforms, and the thread uses one rAF-throttled scroll listener. Zero added JavaScript weight, and `prefers-reduced-motion` turns all of it off. If a later phase needs pinned scroll stories, it can add GSAP.
- **`/` = marketing, `/mirror` = kiosk.** Setting `KIOSK_MODE=1` redirects `/` to `/mirror`, for a mirror that's pinned to the root URL. The kiosk's own logic is unchanged.
- **Prompt:** moved to `lib/tryon/prompt.js`. The honesty prompt from the brief is used as the base, and the existing saree, colourway and body-read anchors are appended. Gemini temperature goes from 0.15 to 0.1. OpenAI images/edits has no temperature setting.
- **Privacy wording:** the camera frame isn't stored. The *result* image goes to Vercel Blob so the QR works, and the link stops working after 15 min. The copy says exactly that. Whether the blob itself gets deleted is noted in CONTENT_TODO.

## Deferred to later phases
Kiosk restyle, eval harness (`scripts/tryon-eval/`), contact form + Resend route, `ASSET_PROMPTS.md`, SEO/OG/sitemap/JSON-LD, Lighthouse pass, page transitions, magnetic buttons.
