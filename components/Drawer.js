"use client";

import { useState } from "react";
import { GARMENTS, inr } from "@/lib/catalogue";

function Card({ garment, index, expanded, onToggle, onPick }) {
  const [colourIdx, setColourIdx] = useState(0);
  const colourway = garment.colourways[colourIdx];

  return (
    <div
      className={`drawer-card ${expanded ? "drawer-card-expanded" : ""}`}
      style={{ animationDelay: `${index * 45}ms` }}
      onClick={() => !expanded && onToggle(garment.id)}
    >
      <div className="drawer-card-photo">
        <img src={garment.image} alt={garment.name} />
      </div>
      <p className="mt-[1.2cqw] font-body text-[1.6cqw] leading-tight text-bone">{garment.name}</p>
      <p className="eyebrow mt-[0.4cqw] text-[1cqw] leading-none text-muted">{garment.fabric}</p>
      <p className="mt-[0.4cqw] font-body text-[1.4cqw] leading-none text-champagne">{inr(garment.price)}</p>

      <div className="drawer-card-detail">
        <div className="flex gap-[1.4cqw]">
          {garment.colourways.map((c, i) => (
            <button
              key={c.name}
              aria-label={c.name}
              onClick={(e) => {
                e.stopPropagation();
                setColourIdx(i);
              }}
              className={`colourway-dot ${i === colourIdx ? "colourway-dot-selected" : ""}`}
            >
              <span className="colourway-dot-swatch" style={{ background: c.hex }} />
            </button>
          ))}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPick(garment, colourway);
          }}
          className="btn-primary mt-[1.6cqw] flex w-full items-center justify-center text-[1.4cqw] leading-none"
          style={{ minHeight: "11.3cqw" }}
        >
          See it on me
        </button>
      </div>
    </div>
  );
}

// The body read already chose the size — no size picker. Every choice
// removed is a choice she cannot get wrong in front of an investor.
export default function Drawer({ capturedPhoto, onPick }) {
  const [tab, setTab] = useState("men");
  const [expandedId, setExpandedId] = useState(null);

  const garments = GARMENTS.filter((g) => g.gender === tab);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {capturedPhoto && (
        <img src={capturedPhoto} alt="" className="drawer-backdrop h-full w-full object-cover" />
      )}

      <div className="drawer-sheet">
        <div className="drawer-tabs px-[4cqw] pt-[2.4cqw]">
          <button
            onClick={() => {
              setTab("men");
              setExpandedId(null);
            }}
            className={`eyebrow text-[1.3cqw] leading-none ${tab === "men" ? "text-bone" : "text-muted"}`}
          >
            Men
          </button>
          <button
            onClick={() => {
              setTab("women");
              setExpandedId(null);
            }}
            className={`eyebrow text-[1.3cqw] leading-none ${tab === "women" ? "text-bone" : "text-muted"}`}
          >
            Women
          </button>
          <span
            className="drawer-tabs-underline"
            style={{ transform: tab === "women" ? "translateX(100%)" : "translateX(0%)" }}
          />
        </div>

        <div className="drawer-rail flex-1 px-[4cqw] py-[3cqw]">
          {garments.map((g, i) => (
            <Card
              key={g.id}
              garment={g}
              index={i}
              expanded={expandedId === g.id}
              onToggle={setExpandedId}
              onPick={onPick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
