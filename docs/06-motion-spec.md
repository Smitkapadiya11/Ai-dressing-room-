# 06 — THE MOTION SPEC
## This one is NOT for Stitch. It is for Claude Code.

Stitch gives you still pictures. Everything below is what turns those still
pictures into the thing that makes a customer say "how did they build this."
Hand this whole file to Claude Code and say: *"implement this motion spec
exactly."*

---

## 1. The three curves. Use only these.

```css
:root {
  /* Things ENTERING the screen. Fast start, long soft landing. */
  --ease-enter: cubic-bezier(0.16, 1, 0.3, 1);      /* 1 */

  /* Things LEAVING. Quick and out of the way. */
  --ease-exit: cubic-bezier(0.7, 0, 0.84, 0);        /* 2 */

  /* Things MOVING while staying on screen. Symmetrical. */
  --ease-move: cubic-bezier(0.65, 0, 0.35, 1);       /* 3 */
}
```

Never use `ease`, `ease-in-out`, or `linear` for anything a person sees move.
Those are the browser defaults and they are the single clearest tell of an
amateur build. `linear` is allowed for exactly one thing: a spinner rotation.

## 2. The five durations. Nothing in between.

```css
--t-instant: 120ms;   /* button press feedback, chip select */
--t-quick:   240ms;   /* hover, small reveals, thumbnail lift */
--t-normal:  420ms;   /* panel slides, card entry, most things */
--t-slow:    680ms;   /* full-screen state change */
--t-hero:   1100ms;   /* the try-on result cross-fade. The money shot. */
```

The rule that matters: **big things move slower than small things.** A 40px
chip at 420ms looks sluggish. A full-screen image at 240ms looks cheap and
twitchy. Scale duration to the distance travelled.

## 3. Real motion blur — the part nobody does

CSS has no motion blur property. You fake it, and done right it is invisible
and expensive-feeling. Two techniques:

**A. Blur-on-enter.** Anything appearing starts slightly blurred and unblurs as
it settles. This is what makes a transition feel like it has weight.

```css
@keyframes riseIn {
  from { opacity: 0; transform: translateY(28px) scale(0.985);
         filter: blur(14px); }
  to   { opacity: 1; transform: none; filter: blur(0); }
}
.rise { animation: riseIn var(--t-normal) var(--ease-enter) both; }
```

**B. Directional streak on fast-moving elements.** For the garment rail when it
flings, apply an SVG feGaussianBlur with `stdDeviation="8 0"` (horizontal only)
while velocity is high, and drop it to `"0 0"` on settle. Horizontal-only blur
reads as speed; uniform blur just reads as out of focus.

Never blur more than 16px and never hold a blur longer than 300ms. Past that it
stops looking like motion and starts looking like a rendering bug.

## 4. Staggering — the single highest-value trick

Nothing arrives at the same time as anything else. When the garment rail loads,
each thumbnail enters 45ms after the one before it.

```js
el.style.animationDelay = `${i * 45}ms`;
```

45–60ms for a row of items. 90ms for two or three big blocks. Cap the total
stagger at 400ms — beyond that the last item feels forgotten. This one line is
the difference between "a grid appeared" and "the collection presented itself."

## 5. The specific moments, timed

**Attract → Mirror (person steps up)**
Camera feed already running underneath at opacity 0. Attract content exits
`--t-quick` with `--ease-exit` and `blur(20px)`. Feed fades up over `--t-slow`.
Garment rail staggers in 200ms later. Total: ~900ms, and it must never make the
customer wait — the feed is live before the animation finishes.

**Garment tap → countdown**
Tapped thumbnail scales to 1.06 in `--t-instant`, then everything else in the
rail drops to opacity 0.3 and `blur(6px)` over `--t-quick`. The 3-2-1 numerals
each: scale from 1.4 → 1.0 with `--ease-enter` over 400ms, hold 400ms, exit
scaling to 0.85 with opacity 0 over 200ms. One numeral per second, exactly.

**Capture flash**
A single white full-screen div, opacity 0 → 0.9 in 60ms, → 0 in 240ms with
`--ease-exit`. Sixty milliseconds is critical; anything slower reads as a bug,
not a shutter.

**Working state**
The garment thumbnail breathes: scale 1.0 → 1.04 → 1.0 over 2400ms, infinite,
`--ease-move`. A progress arc fills over the *expected* duration (12s), easing
out so it slows near the end and never hits 100% until the result actually
lands. Never let a progress indicator finish before the work does — customers
read that as broken.

**Result cross-fade — the moment everything is for**
The captured still is already on screen. The generated image loads underneath
at opacity 0, `scale(1.03)`, `blur(18px)`. Then over `--t-hero` (1100ms) with
`--ease-enter`: result goes to opacity 1, scale 1, blur 0, while the original
goes to opacity 0 and `blur(10px)`. One thousand one hundred milliseconds of
someone becoming someone else. Do not rush this. The price tag, name and QR
enter 350ms after the cross-fade begins, staggered 60ms apart.

**Compare slider**
Drag handle follows the finger with zero lag — position on `pointermove`, no
transition on the clip path during drag. On release only, snap with
`--t-quick` `--ease-move`. Any easing applied during a drag feels broken.

## 6. The non-negotiables

- **Everything on the compositor.** Only ever animate `transform`, `opacity`
  and `filter`. The moment you animate `width`, `height`, `top` or `left` you
  drop frames and the whole illusion collapses.
- **`will-change: transform, opacity`** on the element before it animates —
  and remove it after. Leaving it on permanently eats GPU memory.
- **Touch feedback in 120ms or under.** A kiosk that doesn't respond to a
  finger within ~100ms feels dead, and people tap again, which queues events.
- **Nothing bounces.** No spring overshoot, no elastic. Overshoot reads as
  playful; you are selling expensive clothing.
- **60fps or cut the effect.** A 30fps blur is worse than no blur. Test on the
  actual kiosk hardware, not a MacBook.
- **Respect `prefers-reduced-motion`**: keep opacity fades, drop all transforms
  and blurs.

## 7. The brand moment

KAPADIYA & SONS has to appear every time without ever being in the way.

- **Attract screen:** full lockup, centre. Letters fade up staggered 40ms each
  with `blur(12px)` clearing — letterpress emerging. Below it, a hairline rule
  that draws from centre outward over 900ms, then "EST. SURAT · GUJARAT".
- **Every other screen:** the wordmark sits top-left at 60% opacity, 14px,
  0.3em letter spacing. Always there, never shouting.
- **The result screen:** and only here, the mark goes to 100% opacity and a
  thin champagne rule appears beneath it — because this is the frame the
  customer photographs and sends to her sister. Your name goes in that photo.
