"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { BrandMark } from "./Brand";
import { inr } from "@/lib/catalogue";
import { recommend } from "@/lib/recommend";

// The 1100ms the product exists for — one person becoming another. Do
// not shorten it.
export default function Result({ capturedPhoto, garment, colourway, result, verified, onTryAnother, onPickRecommendation }) {
  const [on, setOn] = useState(false);
  const [compare, setCompare] = useState(false);
  const [split, setSplit] = useState(50);
  const [qr, setQr] = useState(null);
  const draggingRef = useRef(false);
  const heroRef = useRef(null);

  useEffect(() => {
    setOn(false);
    let raf2;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setOn(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [result.image]);

  useEffect(() => {
    let cancelled = false;
    setQr(null);
    fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: result.image }),
    })
      .then((r) => r.json())
      .then((d) => d.url && QRCode.toDataURL(d.url, { margin: 1, width: 240, color: { dark: "#08090B", light: "#F5F3EF" } }))
      .then((png) => !cancelled && png && setQr(png))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [result.image]);

  const recommendations = useMemo(
    () => recommend({ category: garment.category, suggestedColours: result.suggestedColours || [] }),
    [garment.category, result.suggestedColours]
  );

  function moveSplit(e) {
    const rect = heroRef.current.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    setSplit(Math.max(0, Math.min(100, pct)));
  }
  function onPointerDown(e) {
    if (!compare) return;
    draggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    moveSplit(e);
  }
  function onPointerMove(e) {
    if (!compare || !draggingRef.current) return;
    moveSplit(e);
  }
  function onPointerUp() {
    draggingRef.current = false;
  }

  return (
    <div className="absolute inset-0 overflow-y-auto">
      <div
        ref={heroRef}
        className="relative h-full w-full"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {capturedPhoto && (
          <img
            src={capturedPhoto}
            alt=""
            className={`hero-out absolute inset-0 h-full w-full object-cover ${on ? "off" : ""}`}
          />
        )}
        <img
          src={result.image}
          alt=""
          className={`hero-in absolute inset-0 h-full w-full object-cover ${on ? "on" : ""}`}
        />

        {compare && capturedPhoto && (
          <div className="compare-reveal" style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}>
            <img src={capturedPhoto} alt="" className="h-full w-full object-cover" />
          </div>
        )}
        {compare && <div className="compare-divider" style={{ left: `${split}%` }} />}

        <div className="scrim absolute inset-0 pointer-events-none" />

        <div className="absolute left-[4cqw] top-[4cqw]">
          <BrandMark strong />
        </div>

        <div className="absolute bottom-[4cqw] left-[4cqw] max-w-[56cqw]">
          <p className="result-text-line eyebrow text-[1.1cqw] leading-none text-champagne" style={{ animationDelay: "350ms" }}>
            {garment.fabric}
          </p>
          <p
            className="result-text-line mt-[0.8cqw] font-display text-[5.5cqw] leading-tight text-bone"
            style={{ animationDelay: "410ms" }}
          >
            {garment.name}
          </p>
          <p
            className="result-text-line mt-[0.6cqw] font-body text-[1.4cqw] leading-none text-muted"
            style={{ animationDelay: "470ms" }}
          >
            {colourway?.name} · {inr(garment.price)}
          </p>
          {result.recommendedSize && (
            <p
              className="result-text-line mt-[0.8cqw] font-body text-[1.4cqw] leading-none text-champagne"
              style={{ animationDelay: "530ms" }}
            >
              Your size: {result.recommendedSize}
            </p>
          )}
          {verified === true && (
            <p className="poster-line mt-[0.8cqw] font-body text-[1.2cqw] leading-none" style={{ color: "#2C6B58" }}>
              ✓ Fit verified
            </p>
          )}

          <div className="result-text-line mt-[1.6cqw] flex items-center gap-[1.2cqw]" style={{ animationDelay: "590ms" }}>
            <button
              onClick={onTryAnother}
              className="btn-primary flex items-center justify-center text-[1.3cqw] leading-none"
              style={{ minHeight: "11.3cqw" }}
            >
              Try another
            </button>
            {capturedPhoto && (
              <button
                onClick={() => setCompare((c) => !c)}
                className="btn-ghost flex items-center justify-center text-[1.3cqw] leading-none"
                style={{ minHeight: "11.3cqw" }}
              >
                {compare ? "Hide" : "Compare"}
              </button>
            )}
          </div>
        </div>

        {qr && (
          <div
            className="result-text-line qr-card absolute bottom-[4cqw] right-[4cqw] flex w-[13cqw] flex-col items-center gap-[0.6cqw]"
            style={{ animationDelay: "650ms" }}
          >
            <img src={qr} alt="Scan to keep this look" className="w-full rounded" />
            <span className="font-body text-[0.9cqw] leading-none text-ink-soft">Scan to keep</span>
          </div>
        )}
      </div>

      {recommendations.length > 0 && (
        <div className="relative bg-void px-[4cqw] py-[4cqw]">
          <p className="eyebrow mb-[2cqw] text-[1.2cqw] leading-none text-muted">Also made for you</p>
          <div className="rec-rail">
            {recommendations.map(({ garment: g, reason }, i) => (
              <button
                key={g.id}
                className="rec-card"
                style={{ animationDelay: `${i * 45}ms` }}
                onClick={() => onPickRecommendation(g, g.colourways[0])}
              >
                <div className="rec-card-photo">
                  <img src={g.image} alt={g.name} />
                </div>
                <p className="mt-[1cqw] font-body text-[1.3cqw] leading-tight text-bone">{g.name}</p>
                <p className="mt-[0.3cqw] font-body text-[1cqw] leading-none text-champagne">{reason}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
