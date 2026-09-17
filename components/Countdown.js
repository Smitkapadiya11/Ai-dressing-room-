"use client";

import { useEffect, useState } from "react";

const HINTS = {
  5: "Stand back so your feet are in frame",
  4: "Stand back so your feet are in frame",
  3: "Arms relaxed at your sides",
  2: "Arms relaxed at your sides",
  1: "Hold still",
};

function Silhouette() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div className="silhouette-pool absolute inset-0" />
      <svg viewBox="0 0 200 440" className="relative h-[88cqw] w-auto opacity-80" fill="none">
        <ellipse cx="100" cy="48" rx="30" ry="36" stroke="#C9A961" strokeWidth="1.6" strokeDasharray="5 8" />
        <path
          d="M70 96 Q100 84 130 96 L146 150 Q150 200 142 260 L150 400 L118 400 L104 280 L96 280 L82 400 L50 400 L58 260 Q50 200 54 150 Z"
          stroke="#C9A961"
          strokeWidth="1.6"
          strokeDasharray="5 8"
        />
      </svg>
    </div>
  );
}

// Fires onDone() exactly once, at zero, then holds the flash for 240ms
// before the parent moves on.
export default function Countdown({ onDone }) {
  const [n, setN] = useState(5);
  const [flash, setFlash] = useState(false);
  const [fired, setFired] = useState(false);

  useEffect(() => {
    if (n > 0) {
      const t = setTimeout(() => setN((v) => v - 1), 1000);
      return () => clearTimeout(t);
    }
    if (!fired) {
      setFired(true);
      setFlash(true);
      onDone?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
      <Silhouette />
      {n > 0 && (
        <span key={n} className="countdown-numeral relative font-display text-[26cqw] leading-none text-bone">
          {n}
        </span>
      )}
      {n > 0 && (
        <p className="relative mt-[3cqw] font-body text-[1.8cqw] leading-none text-muted">{HINTS[n]}</p>
      )}
      {flash && <div className="countdown-flash absolute inset-0 z-20" />}
    </div>
  );
}
