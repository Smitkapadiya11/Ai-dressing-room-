"use client";

import { useEffect, useRef, useState } from "react";
import { SHOP } from "@/lib/shop";

// In the voice of a house that has been doing this since 1968.
const LINES = [
  "Zari is drawn, never printed.",
  "Six metres, one shoulder, a thousand years.",
  "A good fall needs no correction.",
  "Silk is patient. So is a tailor.",
  "Cloth remembers the body it was cut for.",
  "Every drape is measured twice.",
];

// A pure function of the current time — the index is derived from the
// clock, not stored. The interval below only forces the DOM to catch up
// with that function every 30s; it holds no business state of its own.
function currentLine(now) {
  const hour = now.getHours();
  if (hour < SHOP.opensAt || hour >= SHOP.closesAt) {
    return { text: "Open from ten.", afterHours: true };
  }
  const minutesSinceOpen = (hour - SHOP.opensAt) * 60 + now.getMinutes();
  const i = Math.floor(minutesSinceOpen / 30) % LINES.length;
  return { text: LINES[i], afterHours: false };
}

// Eases toward 94% over 14s and waits there. Never 100% before the image
// is actually in hand — a bar that finishes early is the fastest way to
// look fake.
function ProgressLine({ active }) {
  const [pct, setPct] = useState(0);
  const startRef = useRef(0);

  useEffect(() => {
    if (!active) {
      setPct(0);
      return;
    }
    startRef.current = Date.now();
    let raf;
    const tick = () => {
      const t = Math.min((Date.now() - startRef.current) / 14_000, 1);
      setPct(Math.min(94, (1 - Math.pow(1 - t, 3)) * 100));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  return (
    <span className="poster-progress mt-[2.2cqw]">
      <span className="poster-progress-fill" style={{ width: `${pct}%` }} />
    </span>
  );
}

export default function Poster({ mode = "idle", status }) {
  const [line, setLine] = useState(() => currentLine(new Date()));

  useEffect(() => {
    const t = setInterval(() => setLine(currentLine(new Date())), 30_000);
    return () => clearInterval(t);
  }, []);

  const working = mode === "working";

  const block = (
    <div className="poster-center poster-breathe">
      {working && status && (
        <p
          key={status}
          className="poster-line mb-[2.2cqw] font-body text-[1.5cqw] leading-none not-italic tracking-[0.05em] text-muted"
        >
          {status}
        </p>
      )}

      <div className="flex flex-col items-center">
        <span className="poster-hairline mb-[1.4cqw]" />
        <p className="font-body text-[1.4cqw] leading-none font-semibold uppercase tracking-[0.42em] text-muted">
          Made by
        </p>
        <p className="mt-[0.8cqw] font-display text-[6.5cqw] leading-none font-normal uppercase tracking-[0.16em] text-champagne">
          Smit Kapadiya
        </p>
        <span className="poster-hairline mt-[1.4cqw]" />
      </div>

      <p
        key={line.text}
        className="poster-line mt-[1.6cqw] font-body text-[1.6cqw] leading-[1.4] font-light tracking-[0.06em] text-muted"
      >
        {line.text}
      </p>

      {working && <ProgressLine active={working} />}
    </div>
  );

  return (
    <div className="poster">
      <div className="poster-ambient" />
      <div className={`absolute inset-0 ${!working ? `poster-drift ${line.afterHours ? "poster-slow" : ""}` : ""}`}>
        {block}
      </div>
    </div>
  );
}
