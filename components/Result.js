"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import QRCode from "qrcode";
import { BrandMark } from "./Brand";
import BarLoader from "./BarLoader";
import { inr } from "@/lib/catalogue";
import { recommend } from "@/lib/recommend";

function Icon({ d }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="action-icon">
      <path d={d} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Before on the left, the look on the right. The handle chases the
// finger through a damped lerp every frame — writes go straight to
// style, never through React state, so the drag stays smooth on a kiosk
// GPU. On open it sweeps in from the right edge, so the customer sees
// what the control does before touching it. It is its own layer: the
// action buttons are siblings above it, never inside the drag surface,
// so a tap on "Hide" is always a tap on "Hide".
function CompareSlider({ before }) {
  const rootRef = useRef(null);
  const revealRef = useRef(null);
  const handleRef = useRef(null);
  const target = useRef(100);
  const current = useRef(100);
  const dragging = useRef(false);

  useEffect(() => {
    let raf;
    const paint = () => {
      const c = current.current + (target.current - current.current) * (dragging.current ? 0.35 : 0.12);
      current.current = Math.abs(target.current - c) < 0.05 ? target.current : c;
      if (revealRef.current) revealRef.current.style.clipPath = `inset(0 ${100 - current.current}% 0 0)`;
      if (handleRef.current) handleRef.current.style.left = `${current.current}%`;
      raf = requestAnimationFrame(paint);
    };
    raf = requestAnimationFrame(paint);
    const intro = setTimeout(() => (target.current = 50), 60);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(intro);
    };
  }, []);

  const pctAt = (e) => {
    const r = rootRef.current.getBoundingClientRect();
    return Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100));
  };
  const release = () => (dragging.current = false);

  return (
    <div
      ref={rootRef}
      className="compare-root"
      role="slider"
      tabIndex={0}
      aria-label="Before and after"
      aria-valuemin={0}
      aria-valuemax={100}
      onPointerDown={(e) => {
        dragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        target.current = pctAt(e);
      }}
      onPointerMove={(e) => {
        if (dragging.current) target.current = pctAt(e);
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") target.current = Math.max(0, target.current - 5);
        if (e.key === "ArrowRight") target.current = Math.min(100, target.current + 5);
      }}
    >
      <div ref={revealRef} className="compare-reveal" style={{ clipPath: "inset(0 0% 0 0)" }}>
        <img src={before} alt="Before" className="h-full w-full object-cover" draggable={false} />
      </div>
      <span className="compare-tag left-[4cqw]">Before</span>
      <span className="compare-tag right-[4cqw]">After</span>
      <div ref={handleRef} className="compare-handle" style={{ left: "100%" }}>
        <span className="compare-knob">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 7l-5 5 5 5M15 7l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </div>
  );
}

// The 1100ms the product exists for — one person becoming another. Do
// not shorten it.
export default function Result({ capturedPhoto, garment, colourway, result, verified, onTryAnother, onPickRecommendation }) {
  const [on, setOn] = useState(false);
  const [compare, setCompare] = useState(false);
  const [qrSvg, setQrSvg] = useState(null);
  const [qrFailed, setQrFailed] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

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

  // Fetched quietly in the background the moment the photo lands, so the
  // button is already live by the time she reaches for it. The code is
  // built as SVG — vector, so it stays crisp full-screen. If storage is
  // down the button turns into a direct download instead of vanishing.
  useEffect(() => {
    let cancelled = false;
    setQrSvg(null);
    setQrFailed(false);
    setQrOpen(false);
    setCompare(false);
    fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: result.image }),
    })
      .then((r) => r.json())
      .then((d) =>
        d.url
          ? QRCode.toString(d.url, {
              type: "svg",
              errorCorrectionLevel: "H",
              margin: 2,
              color: { dark: "#08090B", light: "#FFFFFF" },
            })
          : null
      )
      .then((svg) => {
        if (cancelled) return;
        if (svg) setQrSvg(svg);
        else setQrFailed(true);
      })
      .catch(() => !cancelled && setQrFailed(true));
    return () => {
      cancelled = true;
    };
  }, [result.image]);

  useEffect(() => {
    if (!qrOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopImmediatePropagation();
        setQrOpen(false);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [qrOpen]);

  const recommendations = useMemo(
    () => recommend({ category: garment.category, suggestedColours: result.suggestedColours || [] }),
    [garment.category, result.suggestedColours]
  );

  const qrState = qrSvg ? "ready" : qrFailed ? "failed" : "loading";

  return (
    <div className="absolute inset-0 overflow-y-auto overflow-x-hidden">
      <div className="relative h-full w-full">
        {capturedPhoto && (
          <img
            src={capturedPhoto}
            alt=""
            className={`hero-out absolute inset-0 h-full w-full object-cover ${on ? "off" : ""}`}
          />
        )}
        <img
          src={result.image}
          alt="Your try-on"
          className={`hero-in absolute inset-0 h-full w-full object-cover ${on ? "on" : ""}`}
        />

        {compare && capturedPhoto && <CompareSlider before={capturedPhoto} />}

        <div className="result-scrim pointer-events-none absolute inset-0" />

        <div className="pointer-events-none absolute left-[4cqw] top-[clamp(96px,20cqw,136px)]">
          <BrandMark strong />
        </div>

        <div className="result-info">
          <p
            className="result-text-line text-[clamp(9px,1.6cqw,12px)] font-semibold uppercase tracking-[0.24em] text-champagne"
            style={{ animationDelay: "350ms" }}
          >
            {garment.fabric}
          </p>
          <p
            className="result-text-line mt-[0.8cqw] font-display text-[clamp(26px,5.5cqw,44px)] leading-tight text-bone"
            style={{ animationDelay: "410ms" }}
          >
            {garment.name}
          </p>
          <p
            className="result-text-line mt-[0.6cqw] text-[clamp(12px,2.2cqw,16px)] leading-snug text-muted"
            style={{ animationDelay: "470ms" }}
          >
            {colourway?.name} · {inr(garment.price)}
            {result.recommendedSize && <span className="text-champagne"> · Your size {result.recommendedSize}</span>}
          </p>
          {/* #8FCBB0, not the brand's dark green — that one disappears
              against a photograph. */}
          {verified === true && (
            <p className="result-text-line mt-[0.8cqw] text-[clamp(11px,1.9cqw,14px)] leading-none" style={{ color: "#8FCBB0" }}>
              ✓ Fit verified
            </p>
          )}

          <div className="result-text-line result-actions" style={{ animationDelay: "590ms" }}>
            <button type="button" onClick={onTryAnother} className="action action-primary">
              <Icon d="M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4" />
              <span>Try another</span>
            </button>
            {capturedPhoto && (
              <button
                type="button"
                onClick={() => setCompare((c) => !c)}
                className={`action ${compare ? "action-on" : ""}`}
                aria-pressed={compare}
              >
                <Icon d={compare ? "M6 6l12 12M18 6L6 18" : "M12 3v18M8 8l-4 4 4 4M16 8l4 4-4 4"} />
                <span>{compare ? "Hide" : "Compare"}</span>
              </button>
            )}
            {qrState === "failed" ? (
              <a href={result.image} download={`kapadiya-${garment.id}.jpg`} className="action">
                <Icon d="M12 4v11M7 10l5 5 5-5M5 20h14" />
                <span>Download</span>
              </a>
            ) : (
              <button type="button" onClick={() => setQrOpen(true)} disabled={qrState === "loading"} className="action">
                {qrState === "loading" ? (
                  <BarLoader size="sm" />
                ) : (
                  <Icon d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2" />
                )}
                <span>{qrState === "loading" ? "Preparing" : "Get photo"}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {recommendations.length > 0 && (
        <div className="relative bg-void px-[4cqw] py-[4cqw]">
          <p className="mb-[2cqw] text-[clamp(10px,1.7cqw,12px)] font-semibold uppercase tracking-[0.26em] text-muted">
            Also made for you
          </p>
          <div className="rec-rail">
            {recommendations.map(({ garment: g, reason }, i) => (
              <button
                type="button"
                key={g.id}
                className="rec-card"
                style={{ animationDelay: `${i * 45}ms` }}
                onClick={() => onPickRecommendation(g, g.colourways[0])}
              >
                <div className="rec-card-photo">
                  <img src={g.image} alt={g.name} />
                </div>
                <p className="mt-[1cqw] text-[clamp(12px,2.1cqw,15px)] leading-tight text-bone">{g.name}</p>
                <p className="mt-[0.3cqw] text-[clamp(10px,1.7cqw,12px)] leading-none text-champagne">{reason}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Portalled straight to <body> — the mirror's 9:16 panel applies
          CSS containment (required for the cqw container queries), which
          would otherwise trap a position:fixed overlay inside it. This is
          the one piece of the UI meant to fill the REAL screen. */}
      {qrOpen &&
        qrSvg &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="qr-overlay" onClick={() => setQrOpen(false)}>
            <button className="qr-overlay-close" onClick={() => setQrOpen(false)} aria-label="Close">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
            <div className="qr-overlay-code" dangerouslySetInnerHTML={{ __html: qrSvg }} />
            <p className="qr-overlay-label">Point your phone's camera here to save this photo</p>
          </div>,
          document.body
        )}
    </div>
  );
}
