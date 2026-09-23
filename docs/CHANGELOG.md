# Changelog — redesign/landing-v2

Screenshots (local, git-ignored): `qa-screenshots/v2/` (`home-*.png`, `mirror-*.png` at 360, 768, 1280 and 1920). Before: `qa-screenshots/*.png`, the kiosk at `/`. Re-run with `node scripts/qa-home.mjs <base-url>`.

## Routing
- `/` is now the marketing home page. The kiosk moved to `/mirror`, with its logic unchanged.
- **`KIOSK_MODE=1`** (server env) redirects `/` to `/mirror`. Set it on any physical mirror that is pinned to the root URL.
- Pinch-zoom and text selection are locked on `/mirror` only, and are allowed on the marketing page.

## Home page (sections 3.1–3.12)
- Hero, problem, origin timeline, founder thread, three steps, features and coming-soon list, honesty promise, system diagram, six reasons, plans, FAQ, then closing with an enquiry form and footer.
- All copy is in `content/home.js` and `content/pricing.js`. `{{placeholders}}` are stripped at render, and an unanswered FAQ is hidden.
- Pricing is hidden when `NEXT_PUBLIC_SHOW_PRICING=0`.
- No testimonials, logos, stats or invented numbers.

## Try-on honesty
- One prompt, `lib/tryon/prompt.js`, is shared by OpenAI and Gemini. It forbids slimming, skin lightening and makeup, and sizes the garment to the body. The saree, colourway and body-read anchors are kept.
- Gemini temperature goes from 0.15 to 0.1. OpenAI images/edits has no temperature parameter, and no face-restore step exists anywhere.
- **Cache key now includes `PROMPT_VERSION`.** Without it, repeat photos would keep getting results from the old, beautifying prompt. Bump the version whenever the prompt changes.
- `npm run eval:tryon`: the input | garment | output report with a log-only build-drift flag. See `scripts/tryon-eval/README.md`.

## Kiosk restyle (no logic changes)
- Attract screen: the Kapadiya & Sons mark, a breathing gold ring, a large "Touch to begin" and a privacy note. There's an optional attract video (`NEXT_PUBLIC_ATTRACT_VIDEO=1`).
- Countdown: a contracting gold ring on every beat.
- Result reveal: a top-down fabric-drape wipe replaces the blur cross-fade.
- The `.cta` and `.action` buttons are at least 64px tall.

## Contact, SEO, privacy
- `/api/contact` sends through Resend (`RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`), with a honeypot field.
- `sitemap.xml`, `robots.txt` (which disallows `/look/` and `/api/`), a designed OG image, and Organization + Product JSON-LD.
- Privacy copy was checked against the code. Results *are* stored in Blob, and only their links expire, so the copy now says exactly that. See CONTENT_TODO.

## Judgement calls
- **Stayed on JavaScript, not TypeScript.** Converting the working kiosk carries risk and helps no one on the shop floor.
- **No Lenis or GSAP.** Reveals use IntersectionObserver with CSS transforms, and the thread uses one rAF scroll handler. This adds 0 KB of motion library, and `prefers-reduced-motion` turns it all off. Page transitions, magnetic buttons and a cursor trail were left out for the same reason.
- **Kept Playfair Display + Manrope.** They're already self-hosted and already the brand. `next/font` would not change the result.
- The honesty before/after uses labelled placeholder slots, never a generated person.
- QR screen layout was not rebuilt. It works, and it's the riskiest part to touch.

## Not done
- Lighthouse was not run: the Lighthouse CLI isn't installed here. Run `npx lighthouse https://<deploy>/ --form-factor=mobile` against the deploy. The home page ships 104 kB of first-load JS, with no web fonts from third parties and no layout-shifting media.

## Contact details
- WhatsApp/phone +91 75758 07403 and email smitkapadiya.working@gmail.com are live: closing CTAs, footer, JSON-LD.
- With no Resend key set, the demo form opens WhatsApp with the enquiry pre-filled instead of failing.
