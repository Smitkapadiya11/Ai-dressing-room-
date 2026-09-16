# READ THIS BEFORE YOU PASTE ANYTHING

## What Stitch can and cannot do

Stitch generates **static screens**. It does not generate motion, blur, easing,
transitions, or smoothness. Those live in code, not in a design tool.

So the work splits in two:

| | Where it comes from |
|---|---|
| Layout, colour, type, spacing, every screen | **Stitch** — these prompts |
| Motion blur, easing, 60fps transitions, the "Apple feel" | **Code** — see `06-motion-spec.md` |

If you prompt Stitch for "smooth motion blur" you will get nothing back and lose
an afternoon. Design the screens here; build the feel in the kiosk app.

## Four rules Stitch actually enforces

Straight from Google's own prompt guide and from people who have shipped
multi-screen apps with it:

1. **Plain English. Never XML or JSON.** Stitch is worse with structured markup.
2. **Under ~5,000 characters per prompt.** Past that it silently drops components.
   Every prompt in this pack is inside that limit.
3. **One screen, one or two changes per prompt.** Asking for filters + layout +
   icons at once makes it rebuild everything and break what worked.
4. **Hex codes, never colour names.** "Gold" gives you a different gold every time.

## The order to do this in

1. Open Stitch, pick **Experimental mode** (runs on Gemini Pro — better output).
2. Paste prompt **01**. Let it finish. Then **02**, **03**, **04**, **05**.
3. When all screens exist: **select every screen** and paste the unified theme
   prompt in `07-theme-pass.md`. One operation, whole-deck consistency.
4. Switch to **Standard mode** before exporting to Figma — Experimental output
   does not always export cleanly.
5. Export. Then hand the screens to Claude Code to build against.

## Screen size

The kiosk is a **portrait floor totem, 1080 × 1920**. That is exactly 9:16, the
same ratio as a tall phone — so tell Stitch "mobile, 9:16 portrait" and it will
frame it correctly. The shop-owner screens are normal web.

## What's in this folder

| File | Paste into Stitch? | What it is |
|---|---|---|
| `01-design-system.md` | Yes, first | Teaches Stitch the look before it draws anything |
| `02-kiosk-core.md` | Yes | Attract · The Mirror · Countdown |
| `03-kiosk-result.md` | Yes | Working · The Result · Compare |
| `04-kiosk-support.md` | Yes | Consent · Look Book · Size advice · Error |
| `05-shop-owner.md` | Yes | Today · Collection · Your month (desktop web) |
| `06-motion-spec.md` | **NO** | For Claude Code. The actual "Apple feel." |
| `07-theme-pass.md` | Yes, **last** | Select all screens, paste once, everything matches |

13 screens total. Budget about 90 minutes in Stitch.

And `08-body-lock.md` — also not for Stitch. It is how you make the try-on
keep the customer's real body. Read it before you write any API code.
