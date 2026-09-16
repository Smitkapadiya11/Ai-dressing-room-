// Sample shop data. Swap these two functions for your database when the
// first shop signs — every screen reads through here and nowhere else.

import { GARMENTS } from "./garments";

const DAYS = 30;

function seeded(i) {
  // deterministic so the page doesn't jitter between renders
  return Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
}

export function daily() {
  return Array.from({ length: DAYS }, (_, i) => {
    const weekend = (i % 7 === 5 || i % 7 === 6) ? 1.7 : 1;
    return {
      day: i + 1,
      tryOns: Math.round((6 + seeded(i) * 12) * weekend),
    };
  });
}

export function today() {
  const d = daily();
  const month = d.reduce((a, b) => a + b.tryOns, 0);
  return {
    todayCount: d[d.length - 1].tryOns * 3,
    monthCount: month,
    topGarment: GARMENTS[0].name,
    busiestHour: "6–8 pm",
  };
}

export function ranked() {
  return GARMENTS.map((g, i) => ({
    ...g,
    tried: Math.round(94 - i * 19 + seeded(i + 4) * 12),
    sold: Math.round((94 - i * 19) * (0.18 + seeded(i + 9) * 0.22)),
  })).sort((a, b) => b.tried - a.tried);
}

export function triedNotSold() {
  return ranked()
    .map((g) => ({ ...g, gap: g.tried - g.sold }))
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 4);
}
