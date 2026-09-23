# Content still needed from Smit

Placeholders in `content/*.js` look like `{{...}}`. They are stripped before render, so none of them show on the live site. Where one would leave a gap, the item is hidden instead.

## Contact (blocks the "Book a demo" buttons)
- [ ] **WhatsApp number**: `content/home.js → contact.whatsapp` (digits, with 91). This turns on the WhatsApp buttons.
- [ ] **Email**: `contact.email`. This turns on the email link.
- [ ] **Resend** env vars on Vercel: `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, and optionally `CONTACT_FROM_EMAIL` (needs a domain verified in Resend). Until these are set, the form replies "isn't connected yet" and logs the enquiry name.

## Dates and facts
- [ ] Origin timeline: when you saw the mirror in China, and when you decided to build it (`origin.steps[0..1].when`).
- [ ] FAQ: exact hardware spec sheet (`faq → What hardware do I need?`).
- [ ] FAQ: setup time. The question is **hidden** until answered.
- [ ] FAQ: offline plan for large stores.
- [ ] FAQ: payment methods and billing terms.
- [ ] Pricing: are prices inclusive or exclusive of GST? (`content/pricing.js → note`)
- [ ] Pricing: feature bullets and limits for Standard and Brand. Only Lite's "400 try-ons" is defined. Hide the whole section with `NEXT_PUBLIC_SHOW_PRICING=0`.

## Photos and video
- [ ] `public/media/founder.jpg`: real portrait, 4:5. The monogram shows until it's added.
- [ ] `honesty-before.jpg` / `honesty-after.jpg`: **consented** demo photos from the real app. They aren't wired in yet, and the slots are labelled placeholders.
- [ ] Everything in `docs/ASSET_PROMPTS.md`. `attract-loop.mp4` needs `NEXT_PUBLIC_ATTRACT_VIDEO=1`.
- [ ] Consented test photos for `scripts/tryon-eval/photos/` (see its README).

## Stats
- None used. There are no numbers on the page. If you want any, add them with a source.

## Social proof
- None built. There are no testimonials, logos or "trusted by" rows. Add them only once they're real and permitted.

## Privacy: needs a code decision
- [ ] Result images uploaded to Vercel Blob for the QR are **not deleted**. The link stops working after 15 minutes (`lib/store.js`), but the file stays in the store. The copy was reworded to say only that the link expires, which is true. If you want to promise deletion, add a cleanup first (a cron that deletes `looks/*` older than 15 min).
- [ ] The try-on cache (`lib/cache.js`) stores result images in Blob under `cache/` indefinitely, keyed by a hash of the photo. The same decision applies.

## Eval guardrails not yet built
- [ ] Face-embedding similarity score between input and output.
- [ ] Average skin-region colour difference.
Both need an image-processing dependency. The build-drift check through `/api/verify` is live.
