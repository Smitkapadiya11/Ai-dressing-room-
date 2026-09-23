"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GARMENTS, inr } from "@/lib/catalogue";
import { Arrow } from "./Nav";
import ModelPicker from "./ModelPicker";

function Card({ garment, index, expanded, onToggle, onPick }) {
  const [colourIdx, setColourIdx] = useState(0);
  const colourway = garment.colourways[colourIdx];

  return (
    <div
      className={`drawer-card ${expanded ? "drawer-card-expanded" : ""}`}
      style={{ animationDelay: `${Math.min(index, 6) * 45}ms` }}
      data-card
    >
      <button
        type="button"
        className="drawer-card-photo"
        onClick={() => onToggle(expanded ? null : garment.id)}
        aria-expanded={expanded}
        aria-label={`${garment.name}, ${inr(garment.price)}`}
      >
        <img src={garment.image} alt="" draggable={false} loading={index > 3 ? "lazy" : "eager"} />
        <span className="drawer-card-index">{String(index + 1).padStart(2, "0")}</span>
      </button>
      <p className="mt-[1.2cqw] truncate text-[clamp(12px,2.3cqw,16px)] font-semibold leading-tight text-bone">{garment.name}</p>
      <p className="mt-[0.4cqw] truncate text-[clamp(10px,1.8cqw,13px)] leading-snug text-muted">{garment.fabric}</p>
      <p className="mt-[0.5cqw] text-[clamp(12px,2.2cqw,15px)] leading-none text-champagne">{inr(garment.price)}</p>

      <div className="drawer-card-detail">
        <p className="mb-[1cqw] text-[clamp(10px,1.7cqw,12px)] text-bone/80">{colourway.name}</p>
        <div className="grid grid-cols-5 gap-[1cqw]">
          {garment.colourways.map((c, i) => (
            <button
              type="button"
              key={c.name}
              aria-label={c.name}
              onClick={() => setColourIdx(i)}
              className={`colourway-dot ${i === colourIdx ? "colourway-dot-selected" : ""}`}
            >
              <span className="colourway-dot-swatch" style={{ background: c.hex }} />
            </button>
          ))}
        </div>
        <button type="button" onClick={() => onPick(garment, colourway)} className="cta cta-sm mt-[1.4cqw] w-full">
          See it on me
          <span className="cta-icon">
            <Arrow dir="right" />
          </span>
        </button>
      </div>
    </div>
  );
}

// The rail must move for every kind of hand in front of it: a finger
// (native swipe), a mouse wheel (vertical wheel becomes horizontal), a
// mouse drag, the two arrow buttons, and the keyboard's arrow keys.
function useRail(railRef, deps) {
  const [edge, setEdge] = useState({ start: true, end: false, pos: 0 });

  const measure = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const cards = el.querySelectorAll("[data-card]");
    const step = cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : el.clientWidth;
    setEdge({
      start: el.scrollLeft <= 2,
      end: el.scrollLeft >= max - 2,
      pos: Math.min(cards.length - 1, Math.round(el.scrollLeft / Math.max(step, 1))),
      progress: max > 0 ? el.scrollLeft / max : 1,
    });
  }, [railRef]);

  const scrollByCards = useCallback(
    (dir) => {
      const el = railRef.current;
      if (!el) return;
      const card = el.querySelector("[data-card]");
      const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
      const step = card ? card.offsetWidth + gap : el.clientWidth * 0.8;
      // Two cards per press on a wide rail, one on a narrow one.
      const n = Math.max(1, Math.floor(el.clientWidth / step) - 1);
      el.scrollBy({ left: dir * step * n, behavior: "smooth" });
    },
    [railRef]
  );

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    el.scrollLeft = 0;
    measure();

    const onWheel = (e) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      e.preventDefault();
      el.scrollBy({ left: e.deltaY, behavior: "auto" });
    };

    // Mouse drag only — touch keeps the browser's native momentum swipe.
    let drag = null;
    const onDown = (e) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      drag = { x: e.clientX, left: el.scrollLeft, moved: false };
    };
    const onMove = (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) > 5) {
        drag.moved = true;
        el.classList.add("is-dragging");
      }
      if (drag.moved) el.scrollLeft = drag.left - dx;
    };
    const onUp = () => {
      if (!drag) return;
      const moved = drag.moved;
      drag = null;
      el.classList.remove("is-dragging");
      // A drag must not also count as a tap on the card it ended over.
      if (moved) {
        const swallow = (ev) => ev.stopPropagation();
        el.addEventListener("click", swallow, true);
        setTimeout(() => el.removeEventListener("click", swallow, true), 0);
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("scroll", measure, { passive: true });
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("resize", measure);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("scroll", measure);
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("resize", measure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") scrollByCards(1);
      if (e.key === "ArrowLeft") scrollByCards(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [scrollByCards]);

  return { edge, scrollByCards };
}

// The body read already chose the size — no size picker. Every choice
// removed is a choice she cannot get wrong in front of an investor.
export default function Drawer({ capturedPhoto, onPick, engines, engine, onEngine }) {
  const [tab, setTab] = useState("men");
  const [expandedId, setExpandedId] = useState(null);
  const railRef = useRef(null);

  const garments = GARMENTS.filter((g) => g.gender === tab);
  const counts = { men: GARMENTS.filter((g) => g.gender === "men").length, women: GARMENTS.filter((g) => g.gender === "women").length };
  const { edge, scrollByCards } = useRail(railRef, [tab]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {capturedPhoto && <img src={capturedPhoto} alt="" className="drawer-backdrop h-full w-full object-cover" />}

      <div className="drawer-sheet">
        <div className="drawer-grip" />

        <div className="flex items-end justify-between gap-[2cqw] px-[4cqw] pt-[2.4cqw]">
          <div>
            <p className="text-[clamp(9px,1.6cqw,12px)] font-semibold uppercase tracking-[0.26em] text-champagne">Choose a piece</p>
            <p className="mt-[0.6cqw] text-[clamp(11px,1.9cqw,14px)] text-muted">Tap a garment, pick a colour, see it on you.</p>
          </div>
          <div className="seg" role="tablist">
            {["men", "women"].map((t) => (
              <button
                type="button"
                role="tab"
                key={t}
                aria-selected={tab === t}
                onClick={() => {
                  setTab(t);
                  setExpandedId(null);
                }}
                className={`seg-btn ${tab === t ? "on" : ""}`}
              >
                {t === "men" ? "Men" : "Women"}
                <span className="seg-count">{counts[t]}</span>
              </button>
            ))}
            <span className="seg-thumb" style={{ transform: tab === "women" ? "translateX(100%)" : "none" }} />
          </div>
        </div>

        <div className="relative min-h-0 flex-1">
          <div ref={railRef} className="drawer-rail h-full px-[4cqw] py-[2.6cqw]">
            {garments.map((g, i) => (
              <Card key={g.id} garment={g} index={i} expanded={expandedId === g.id} onToggle={setExpandedId} onPick={onPick} />
            ))}
            <span className="w-[1cqw] shrink-0" aria-hidden="true" />
          </div>

          <button type="button" aria-label="Previous garments" onClick={() => scrollByCards(-1)} disabled={edge.start} className="rail-arrow left-[1.6cqw]">
            <Arrow dir="left" />
          </button>
          <button type="button" aria-label="More garments" onClick={() => scrollByCards(1)} disabled={edge.end} className="rail-arrow right-[1.6cqw]">
            <Arrow dir="right" />
          </button>
        </div>

        <div className="flex items-center gap-[2cqw] px-[4cqw] pb-[3cqw]">
          <span className="text-[clamp(10px,1.7cqw,12px)] tabular-nums text-muted">
            <span className="text-bone">{String(edge.pos + 1).padStart(2, "0")}</span> / {String(garments.length).padStart(2, "0")}
          </span>
          <span className="rail-progress">
            <span style={{ transform: `scaleX(${Math.max(0.06, edge.progress ?? 0)})` }} />
          </span>
          <span className="rail-hint">Scroll, drag or use ← →</span>
          <ModelPicker engines={engines} value={engine} onChange={onEngine} />
        </div>
      </div>
    </div>
  );
}
