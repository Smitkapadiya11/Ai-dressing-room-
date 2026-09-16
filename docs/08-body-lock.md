# 08 — MAKING THE BODY STAY THE BODY
## The part that decides whether this business works

Everything in the other seven files is how it *looks*. This is whether it
*works*. A customer forgives a slow load. She does not forgive being made 8kg
thinner or 3 inches taller, and she will not send that photo to anyone.

There are two ways to do this. Build the first one today. Build the second one
in week two, once you have the first one working.

---

# WAY 1 — THE SIMPLE WAY
### One API call. Forty minutes of work. Gets you ~80% there.

Nothing clever. One well-built prompt to `gemini-3.1-flash-image` with two
images attached: the customer's photo and the garment photo. What matters is
entirely in the wording.

### The prompt that works

```
You are performing a virtual garment fitting.

IMAGE 1 is a photograph of a real person.
IMAGE 2 is a garment.

Produce IMAGE 1 again, unchanged in every way, except that the person
is now wearing the garment from IMAGE 2.

ABSOLUTELY MUST NOT CHANGE — treat IMAGE 1 as a locked photograph:
- Face, every feature, expression, and skin tone
- Body width, shoulder width, waist, hips, arm thickness, height
- Weight and build. Do not slim, lengthen, or idealise the person
- Pose, stance, and where the hands and feet are
- Hair
- The background, the floor, and the lighting direction

MUST MATCH IMAGE 2 EXACTLY:
- Fabric colour, exact shade
- Print, pattern, motifs, and their scale relative to the body
- Border design, zari work, embroidery placement
- Neckline shape, sleeve length, overall garment length

The garment must drape over the body that is actually in IMAGE 1. If the
person is broader than a model, the garment is wider on them. If the person
is shorter, the garment is shorter. Fabric follows this body, not an ideal
one.

Output the full photograph at the same framing and aspect ratio as IMAGE 1.
```

### The four settings that matter more than the prompt

```js
{
  temperature: 0.15,        // low. creativity is your enemy here
  seed: 42,                 // fixed, so the same input gives the same output
  candidateCount: 1,
  responseModalities: ["IMAGE"]
}
```

`temperature: 0.15` alone removes most body drift. People leave it at the
default 1.0 and then wonder why every generation looks like a different woman.

### Three things to do to the input photo first

These cost nothing and improve results more than any prompt tweak:

1. **Send it big.** Downscale to 1280px on the long edge, not 512. Detail in
   equals detail out.
2. **Crop to full body, feet included.** A half-body crop makes the model
   invent the lower half, and inventing is exactly what you are trying to stop.
3. **Plain wall behind, even light.** This is a kiosk — you control it. A
   matte mid-grey backdrop panel behind the standing spot costs ₹900 and does
   more for output quality than a month of prompt work.

That is Way 1. Ship it. It will carry your demo and your first shop.

---

# WAY 2 — THE PREMIUM WAY
### Three calls. The thing nobody else in India is doing.

The weakness of Way 1: you are *asking* the model to preserve the body, then
hoping. Way 2 *measures* the body first, *tells* the model exactly what it
must reproduce, then *checks* whether it did.

### Pass A — Read the body (once per customer, ~1.2s, ₹0.30)

Before the garment is even chosen, while she is still standing in front of the
mirror, send her photo with a text-only request:

```
Describe this person's physical structure for a tailor, factually and
without flattery. Give exactly these, one per line:
- Height impression (short / average / tall) and head-to-body ratio
- Shoulder width relative to hips
- Build (slim / average / full / broad)
- Torso length relative to legs
- Arm thickness
- Exact posture and stance
- Skin tone in plain words
- Which way the body is turned relative to the camera
No opinions, no compliments, no guesses about age or weight in kg.
```

You get back ~90 words. **Cache it against her session.** This is the anchor.

### Pass B — Generate, with the anchor injected

Same prompt as Way 1, with one block inserted before the "MUST NOT CHANGE"
section:

```
The person in IMAGE 1 has this exact physical structure, confirmed:
<paste Pass A output here>

The person in your output must match this description in every particular.
This is a measurement, not a suggestion.
```

This is the whole trick. You have converted "don't change the body" — a
negative instruction, which diffusion models handle badly — into "reproduce
this specific body," a positive one, which they handle well. This single change
is worth more than everything else in this file.

### Pass C — Verify, and retry once if it drifted (~0.8s, ₹0.30)

Send the *generated* image back with the Pass A description:

```
Here is a description of a person's build:
<Pass A output>

Does the person in this image match that description? Answer with only a
JSON object: {"match": true|false, "drift": "<what differs, or empty>"}
```

If `match` is false, regenerate once with `"drift"` appended as an extra
constraint. If it fails twice, show her the result anyway with the compare
slider open — she can see for herself, and honesty beats a bad silent result.

In testing this pattern, the second attempt succeeds the large majority of the
time, because the failure reason is fed back in as an explicit instruction.

### What Way 2 costs

| | Per try-on |
|---|---|
| Pass A (body read) | ₹0.30 — once per customer, not per garment |
| Pass B (generate) | ₹3.70 |
| Pass C (verify) | ₹0.30 |
| Retry, ~25% of the time | ₹0.93 |
| **Realistic average** | **≈ ₹5.00** |

Against ₹3.70 for Way 1. You are paying about ₹1.30 extra per try-on to
almost entirely remove the failure that would lose you the shop. At 400
try-ons a month that is ₹520. It is the cheapest insurance in the whole
business.

---

## Indian garments — what actually breaks

You have not tested this yet, and it is still the largest open risk in the
entire plan. What to expect when you do:

| Garment | Difficulty | The specific failure |
|---|---|---|
| Kurta, shirt, top | Easy | Almost none |
| Salwar kameez | Easy | Dupatta drape sometimes floats |
| Lehenga | Medium | Pleat count and flare volume wander |
| **Saree** | **Hard** | The pallu. It is a 6-metre unstitched drape — there is no fixed shape to copy, and the model invents one |
| Sherwani | Medium | Button placket and embroidery scale |

For sarees specifically, add this line to the prompt:

```
This is a saree. The pallu must fall over the LEFT shoulder and hang
behind, the pleats must be at the front centre gathered at the waist, and
the border must run continuously along the full length of the fabric with
no break in the pattern.
```

**Test this before you promise it to anyone.** Ten garments — two sarees, two
lehengas, three kurtas, three salwar suits — across three different body types.
Thirty images. Roughly ₹110 at Way 1 prices, about two hours. You have been
carrying this risk since day one. It is the cheapest thing on your entire list
and the only one that can invalidate everything else.

---

## The one-line version

**Simple:** low temperature, fixed seed, full-body 1280px input, and a prompt
that lists what must not change.

**Premium:** describe the body first, feed that description into the
generation as a requirement, then check the output against it and retry once.

Build simple today. Build premium the week after. Never build neither.
