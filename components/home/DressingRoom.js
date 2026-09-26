"use client";
import { useEffect, useRef, useState } from "react";
import { studio } from "@/content/home";
import Icon from "./Icon";

const BEFORE = "/looks/mirror-feed.jpg";
const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Hero mirror: the same customer, a new outfit every few seconds, drawn in
// behind a silk curtain wipe. Pauses when the tab is hidden.
export function HeroMirror() {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduced()) return;
    const t = setInterval(() => !document.hidden && setI((n) => (n + 1) % studio.looks.length), 3600);
    return () => clearInterval(t);
  }, []);
  const look = studio.looks[i];

  return (
    <div className="dr-hero" role="img" aria-label="A customer in the AI dressing room, wearing a new outfit every few seconds">
      <div className="dr-halo" aria-hidden="true" />
      <div className="k-mirror dr-mirror">
        <div className="k-mirror__glass">
          <img src={BEFORE} alt="" fetchPriority="high" />
          {studio.looks.map((l, n) => (
            <img key={l.src} src={l.src} alt="" className={`dr-look ${n === i ? "is-on" : ""}`} />
          ))}
          <div className="dr-shine" aria-hidden="true" />
        </div>
      </div>
      <div className="dr-chip dr-chip--a" key={`a${i}`}>
        <span className="dr-dot" /> {look.name}
      </div>
      <div className="dr-chip dr-chip--b" key={`b${i}`}>
        <Icon name="spark" size={14} /> {look.cheer}
      </div>
      <div className="dr-chip dr-chip--c">Kapadiya_ai v1.1 · live</div>
    </div>
  );
}

// The studio: pick a look off the rail, drag the seam to compare, and get a
// small cheer each time. The whole point is the "oh, that's me" moment.
export function Studio() {
  const [sel, setSel] = useState(0);
  const [pos, setPos] = useState(58);
  const [burst, setBurst] = useState(0);
  const frame = useRef(null);
  const dragging = useRef(false);

  const move = (clientX) => {
    const r = frame.current.getBoundingClientRect();
    setPos(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)));
  };
  const pick = (n) => {
    setSel(n);
    setBurst((b) => b + 1);
    if (!reduced()) {
      setPos(0);
      requestAnimationFrame(() => requestAnimationFrame(() => setPos(62)));
    }
  };
  const look = studio.looks[sel];

  return (
    <div className="dr-studio">
      <div
        ref={frame}
        className={`dr-frame ${dragging.current ? "" : "is-easing"}`}
        style={{ "--pos": `${pos}%` }}
        onPointerDown={(e) => {
          dragging.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          move(e.clientX);
        }}
        onPointerMove={(e) => dragging.current && move(e.clientX)}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
      >
        <img src={BEFORE} alt="The customer as the camera sees them" draggable="false" />
        <div className="dr-after">
          <img src={look.src} alt={`The same customer wearing ${look.name}`} draggable="false" />
        </div>
        <div className="dr-seam" aria-hidden="true">
          <span><Icon name="arrows" size={20} /></span>
        </div>
        <span className="dr-tag dr-tag--l">As you walked in</span>
        <span className="dr-tag dr-tag--r">In the mirror</span>
        <input
          className="dr-range"
          type="range"
          min="0"
          max="100"
          value={Math.round(pos)}
          onChange={(e) => setPos(+e.target.value)}
          aria-label="Compare before and after"
        />
        <div className="dr-burst" key={burst} aria-hidden="true">
          {burst > 0 && Array.from({ length: 14 }, (_, k) => <i key={k} style={{ "--k": k }} />)}
        </div>
      </div>

      <div className="dr-side">
        <p className="dr-now" key={`n${sel}`}>
          <span className="k-label">Now wearing</span>
          <strong>{look.name}</strong>
          <em>{look.cheer}</em>
        </p>
        <div className="dr-rail" role="listbox" aria-label="Choose a look">
          {studio.looks.map((l, n) => (
            <button
              key={l.src}
              type="button"
              role="option"
              aria-selected={n === sel}
              className={`dr-swatch ${n === sel ? "is-on" : ""}`}
              onClick={() => pick(n)}
            >
              <img src={l.src} alt="" loading="lazy" />
              <span>{l.short}</span>
            </button>
          ))}
        </div>
        <p className="dr-hint">{studio.hint}</p>
        <a href="/mirror" className="k-btn k-btn--gold">
          {studio.cta} <span className="k-arrow" aria-hidden="true">→</span>
        </a>
      </div>
    </div>
  );
}
