// THE TRY-ON PROMPT — one constant, shared by every provider.
//
// Investor feedback: results looked "made up" (makeup, smoothed skin,
// lighter skin, slimmer bodies). The customer must see the garment on
// THEIR body. Only the clothing may change.
//
// Image order is fixed everywhere: Image 1 = PERSON, Image 2 = GARMENT.

export const TRYON_PROMPT = `TASK: Virtual clothing try-on. Edit Image 1 so the person is wearing the garment shown in Image 2. Change ONLY the clothing. Everything else in Image 1 must stay exactly as it is.

INPUTS
- Image 1 (PERSON): a real customer photographed in a clothing shop. This is the ground truth for the person.
- Image 2 (GARMENT): a catalogue garment. This is the ground truth for the clothing. If it shows a complete outfit, every piece shown is worn together.

PRESERVE FROM IMAGE 1 — DO NOT ALTER:
1. Body shape and size: keep the exact body weight, build, proportions, belly, hips, chest, arms, shoulders and height. Do NOT slim, thin, tone, lengthen, reshape or "idealise" the body in any way. A heavier person must remain exactly as heavy. A thin person must remain exactly as thin.
2. Skin: keep the exact skin tone, colour, undertone, texture, pores, marks, moles, scars and hair on skin. Do NOT lighten, brighten, whiten, even out or smooth the skin.
3. Face: keep the face identical — same features, expression, age, wrinkles, facial hair, glasses, bindi, jewellery. Do NOT add makeup, lipstick, blush, eyeliner, kajal or foundation. Do NOT remove makeup the person is already wearing. No face retouching, no beautification filter.
4. Hair: same hairstyle, length, colour and volume.
5. Pose, head angle, hand positions and camera angle.
6. Background, lighting direction, lighting colour and shadows of the original photo.

APPLY FROM IMAGE 2 — REPRODUCE EXACTLY:
1. The same garment type and cut (e.g. saree with pallu, lehenga, kurta, shirt, dress).
2. Exact colours — do not shift hue or saturation.
3. Exact print, pattern, weave, border, zari, embroidery and motifs, at the correct scale.
4. Fabric behaviour: silk, cotton, georgette, chiffon, denim etc. must drape and fold as that fabric would.

FIT RULES:
- Size the garment to THIS person's actual body, as if it were bought in their correct size. It must follow their real contours, including a fuller stomach, wider hips or a slimmer frame.
- Fabric should drape, stretch, crease and fold naturally around their real shape, under the lighting of Image 1.
- Do NOT change the body to fit the garment. Change the garment to fit the body.
- Remove or cover the original clothing only where the new garment would cover it. Keep visible accessories (watch, bangles, footwear) unless the garment naturally covers them.
- If the person is turned away, in profile or three-quarter, continue the fabric, border and embroidery around the body in the same scale and rhythm as the visible side. Do not invent new motifs and do not rotate the person toward the camera.

OUTPUT:
- One photorealistic image, same framing and resolution as Image 1. Keep the person at the same scale and position in the frame — do not zoom, re-centre or crop differently.
- It must look like an unedited photo of this same person, taken in the same moment, simply wearing different clothes.
- No text, no watermark, no added people, no background change, no stylisation, no fashion-model look.

If any instruction conflicts, preserving the person's real body, skin and face takes priority over making the garment look good.`;

// Part of the cache key: a changed prompt must never serve results made by the old one.
export const PROMPT_VERSION = "honest-v1";

function colourwayLine(garment, colourway) {
  const isDefault = !colourway || colourway.name === garment.colourways[0].name;
  if (isDefault) return "";
  return `\n\nCOLOURWAY: Render the garment in ${colourway.name}, approximately ${colourway.hex}. Keep the weave, the embroidery and the border pattern exactly as they are in Image 2 — only the colour of the fabric changes.`;
}

function sareeLine(garment) {
  if (garment.category !== "saree") return "";
  return `\n\nSAREE: The pallu falls over the LEFT shoulder and hangs behind, the pleats sit at the front centre gathered at the waist, and the border runs continuously along the full length of the fabric with no break in the pattern.`;
}

function bodyAnchor(bodyRead) {
  if (!bodyRead) return "";
  return `\n\nMEASURED BUILD OF THE PERSON IN IMAGE 1 (a measurement, not a suggestion — the output must match it in every particular):\n${bodyRead}`;
}

export function buildTryOnPrompt({ garment, bodyRead, colourway }) {
  return TRYON_PROMPT + bodyAnchor(bodyRead) + colourwayLine(garment, colourway) + sareeLine(garment);
}
