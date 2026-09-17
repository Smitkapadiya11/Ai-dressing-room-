"use client";

import { useState } from "react";
import { GARMENTS, inr } from "@/lib/catalogue";

// Deliberately plain — this is just enough to pick a garment and a
// colourway and fire the engine. The real catalogue drawer is pass 3.
export default function GarmentPicker({ onPick }) {
  const [activeColour, setActiveColour] = useState({});

  return (
    <div className="absolute inset-0 overflow-y-auto bg-void px-[4cqw] py-[6cqw]">
      <p className="mb-[3cqw] font-body text-[1.6cqw] leading-none uppercase tracking-[0.3em] text-muted">
        Choose a piece
      </p>
      <div className="flex flex-col gap-[3cqw]">
        {GARMENTS.map((g) => {
          const ci = activeColour[g.id] ?? 0;
          const colourway = g.colourways[ci];
          return (
            <div key={g.id} className="flex items-center gap-[3cqw]">
              <img src={g.image} alt="" className="h-[16cqw] w-[12cqw] shrink-0 rounded bg-surface object-cover" />
              <div className="flex-1">
                <p className="font-body text-[1.8cqw] leading-tight text-bone">{g.name}</p>
                <p className="mt-[0.4cqw] font-body text-[1.4cqw] leading-none text-muted">{inr(g.price)}</p>
                <div className="mt-[1cqw] flex gap-[0.8cqw]">
                  {g.colourways.map((c, i) => (
                    <button
                      key={c.name}
                      onClick={() => setActiveColour((a) => ({ ...a, [g.id]: i }))}
                      aria-label={c.name}
                      className="h-[2.4cqw] w-[2.4cqw] shrink-0 rounded-full"
                      style={{
                        background: c.hex,
                        outline: i === ci ? "2px solid #C9A961" : "1px solid rgba(255,255,255,0.25)",
                        outlineOffset: "2px",
                      }}
                    />
                  ))}
                </div>
              </div>
              <button
                onClick={() => onPick(g, colourway)}
                className="btn-primary flex shrink-0 items-center justify-center text-[1.4cqw] leading-none"
                style={{ padding: "1.2cqw 2.2cqw" }}
              >
                Try
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
