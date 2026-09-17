// The shop's identity and the two numbers that shape the whole kiosk.
// There is NO daily cap and NO slot scheduling here — remove any such code
// if you find it. The Poster is what fills an empty shop, not a quota.

export const SHOP = {
  name: process.env.NEXT_PUBLIC_SHOP_NAME || "Kapadiya & Sons",
  city: "Surat",
  opensAt: 10,
  closesAt: 19,
  idleReturnMs: 90_000, // anywhere in the app, 90s of nothing -> Poster
};
