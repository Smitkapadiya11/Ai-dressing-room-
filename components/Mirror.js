"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { BrandLockup, BrandMark, Monogram } from "./Brand";
import { inr } from "@/lib/garments";

/* ============================================================
   TIMINGS — every number here comes from 06-motion-spec.md
   ============================================================ */
const COUNTDOWN_FROM = 5;
const IDLE_RETURN_MS = 45_000;
const EXPECTED_MS = 12_000;   // progress arc eases toward this, never past 94%
const SHUTTER_MS = 300;
const HERO_MS = 1100;

/* ---------- frame grab, mirrored to match what she sees ---------- */
function grabFrame(video, maxEdge = 1280) {
  const vw = video.videoWidth || 1080;
  const vh = video.videoHeight || 1920;
  const scale = Math.min(1, maxEdge / Math.max(vw, vh));
  const w = Math.round(vw * scale);
  const h = Math.round(vh * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.translate(w, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.92);
}

/* ---------- the silhouette she stands inside ---------- */
function Silhouette() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 58% 52% at 50% 46%, rgba(8,9,11,0.80) 0%, rgba(8,9,11,0.55) 40%, rgba(8,9,11,0.18) 68%, rgba(8,9,11,0) 82%)",
        }}
      />
      <svg viewBox="0 0 200 440" className="breathe relative h-[min(44vh,44vw)] w-auto opacity-90" style={{ filter: "drop-shadow(0 0 14px rgba(8,9,11,0.9))" }} fill="none">
        <ellipse cx="100" cy="48" rx="30" ry="36" stroke="#C9A961" strokeWidth="1.6" strokeDasharray="5 8" />
        <path
          d="M70 96 Q100 84 130 96 L146 150 Q150 200 142 260 L150 400 L118 400 L104 280 L96 280 L82 400 L50 400 L58 260 Q50 200 54 150 Z"
          stroke="#C9A961" strokeWidth="1.6" strokeDasharray="5 8"
        />
      </svg>
      <span className="eyebrow relative mt-space-lg rounded-full bg-void/70 px-4 py-2 text-champagne backdrop-blur-md">
        Stand anywhere · any angle works
      </span>
    </div>
  );
}

/* ---------- progress arc that never finishes before the work does ---------- */
function ProgressArc({ startedAt }) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    let raf;
    const tick = () => {
      const t = (Date.now() - startedAt) / EXPECTED_MS;
      // ease-out, asymptotic to 94%. It slows near the end and waits.
      setPct(Math.min(0.94, 1 - Math.pow(1 - Math.min(t, 1), 3)) * 100);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [startedAt]);

  const R = 58;
  const C = 2 * Math.PI * R;
  return (
    <svg viewBox="0 0 140 140" className="h-[clamp(108px,16vw,168px)] w-[clamp(108px,16vw,168px)] -rotate-90">
      <circle cx="70" cy="70" r={R} stroke="rgba(245,243,239,0.16)" strokeWidth="2" fill="none" />
      <circle
        cx="70" cy="70" r={R} stroke="#C9A961" strokeWidth="2" fill="none" strokeLinecap="round"
        strokeDasharray={C} strokeDashoffset={C - (pct / 100) * C}
        style={{ transition: "stroke-dashoffset 120ms linear" }}
      />
    </svg>
  );
}

/* ============================================================
   THE MIRROR
   ============================================================ */
export default function Mirror({ garments, shop }) {
  const [stage, setStage] = useState("attract"); // attract|consent|mirror|countdown|working|result|failed
  const [selected, setSelected] = useState(null);
  const [count, setCount] = useState(COUNTDOWN_FROM);
  const [captured, setCaptured] = useState(null);
  const [result, setResult] = useState(null);
  const [resultOn, setResultOn] = useState(false);
  const [flash, setFlash] = useState(false);
  const [qr, setQr] = useState(null);
  const [err, setErr] = useState(null);
  const [meta, setMeta] = useState(null);
  const [camError, setCamError] = useState(null);
  const [workStart, setWorkStart] = useState(0);
  const [compare, setCompare] = useState(false);
  const [split, setSplit] = useState(50);
  const [lookbook, setLookbook] = useState([]);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const idleRef = useRef(null);
  const bodyReadRef = useRef(null); // Pass A cached — read once per customer
  const railRef = useRef(null);

  /* ---------- idle return ---------- */
  const poke = useCallback(() => {
    clearTimeout(idleRef.current);
    idleRef.current = setTimeout(() => {
      setStage("attract");
      setResult(null);
      setResultOn(false);
      setCaptured(null);
      setSelected(null);
      setCompare(false);
      bodyReadRef.current = null; // new customer, new body read
    }, IDLE_RETURN_MS);
  }, []);

  useEffect(() => {
    if (stage === "attract") { clearTimeout(idleRef.current); return; }
    poke();
    return () => clearTimeout(idleRef.current);
  }, [stage, poke]);

  /* ---------- camera ---------- */
  const startCamera = useCallback(async () => {
    if (streamRef.current) return true;
    try {
      // A phone selfie cam and a laptop/monitor webcam hand back very
      // different native aspect ratios. Ask for whichever orientation
      // actually matches the screen so object-cover doesn't over-crop.
      const portrait =
        typeof window !== "undefined" && window.innerHeight >= window.innerWidth;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: portrait ? 1080 : 1920 },
          height: { ideal: portrait ? 1920 : 1080 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCamError(null);
      return true;
    } catch (e) {
      // No camera is not a dead end — the demo still runs on a still frame.
      setCamError(e?.name === "NotAllowedError" ? "denied" : "unavailable");
      return false;
    }
  }, []);

  useEffect(() => () => streamRef.current?.getTracks().forEach((t) => t.stop()), []);

  /* ---------- countdown ---------- */
  useEffect(() => {
    if (stage !== "countdown") return;
    if (count <= 0) { capture(); return; }
    const t = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, count]);

  /* ---------- the run ---------- */
  async function capture() {
    setFlash(true);
    setTimeout(() => setFlash(false), SHUTTER_MS);

    let frame = null;
    if (videoRef.current && streamRef.current) {
      try { frame = grabFrame(videoRef.current); } catch {}
    }
    setCaptured(frame);
    setWorkStart(Date.now());
    setStage("working");

    try {
      const res = await fetch("/api/tryon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          person: frame,
          garmentId: selected.id,
          bodyRead: bodyReadRef.current,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.fallback) { land(data.fallback, { ...data, demo: true }); return; }
        throw new Error(data.error || "That look did not come through.");
      }

      if (data.bodyRead) bodyReadRef.current = data.bodyRead;
      land(data.image, data);
    } catch (e) {
      setErr(e.message || "Something went wrong.");
      setStage("failed");
    }
  }

  function land(image, data) {
    setResult(image);
    setMeta(data);
    setStage("result");
    setLookbook((l) => (l.some((x) => x.id === selected.id) ? l : [...l, { ...selected, image }]));
    // one frame later, so the transition actually runs
    requestAnimationFrame(() => requestAnimationFrame(() => setResultOn(true)));

    fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image, garmentName: selected.name, price: inr(selected.price) }),
    })
      .then((r) => r.json())
      .then((d) => d.url && QRCode.toDataURL(d.url, {
        margin: 1, width: 240, color: { dark: "#08090B", light: "#F5F3EF" },
      }))
      .then((png) => png && setQr(png))
      .catch(() => {});
  }

  function pick(g) {
    setSelected(g);
    setCount(COUNTDOWN_FROM);
    setStage("countdown");
  }

  function backToMirror() {
    setResult(null); setResultOn(false); setCaptured(null);
    setQr(null); setMeta(null); setCompare(false); setSplit(50);
    setStage("mirror");
  }

  function begin() {
    setStage("consent");
  }

  async function accept() {
    await startCamera();
    setStage("mirror");
  }

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <div
      className="relative h-[100dvh] w-full overflow-hidden bg-void"
      onPointerDown={poke}
      onPointerMove={poke}
    >
      {/* ---------- live feed, always mounted underneath ---------- */}
      <div className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          playsInline muted autoPlay
          className="h-full w-full object-cover"
          style={{
            transform: "scaleX(-1)",
            opacity: stage === "attract" || stage === "consent" ? 0 : captured || result ? 0 : 1,
            transition: "opacity var(--t-slow) var(--ease-enter)",
          }}
        />
        {camError && stage !== "attract" && stage !== "consent" && !captured && !result && (
          <img src="/looks/mirror-feed.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
      </div>

      {/* the still she was captured as — sits under the result for the cross-fade */}
      {captured && (
        <img
          src={captured} alt=""
          className={`absolute inset-0 z-[1] h-full w-full object-cover ${
            stage === "result" ? "hero-out" : ""
          } ${stage === "result" && resultOn ? "off" : ""}`}
        />
      )}

      {/* ---------- ATTRACT ---------- */}
      {stage === "attract" && (
        <button
          onClick={begin}
          className="absolute inset-0 z-30 flex w-full flex-col items-center justify-between px-margin py-space-xl text-left"
        >
          <img src="/brand/boutique.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-void/[0.86] backdrop-blur-[2px]" />
          <div
            className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse at center, transparent 0%, rgba(8,9,11,0.6) 55%, #08090B 100%)" }}
          />

          <div className="relative pt-space-md"><BrandLockup /></div>

          <div className="relative my-auto flex flex-col items-center text-center">
            <span
              className="fade-up eyebrow mb-space-md rounded-full border border-champagne/30 bg-void/50 px-4 py-2 text-champagne backdrop-blur-md"
              style={{ animationDelay: "1300ms" }}
            >
              ✦ AI-Powered Virtual Try-On
            </span>
            <h1
              className="fade-up font-display text-display-lg text-bone"
              style={{ animationDelay: "1500ms" }}
            >
              See it on you.
            </h1>
            <p
              className="fade-up mt-space-sm font-body text-title-md font-light text-muted"
              style={{ animationDelay: "1700ms" }}
            >
              Tap anywhere to begin.
            </p>
          </div>

          <div className="relative flex flex-col items-center gap-space-sm pb-space-lg">
            <span className="soft-pulse h-[1px] w-[60px] bg-champagne" />
            <span className="eyebrow text-bone/40">Works on any screen · any angle</span>
          </div>
        </button>
      )}


      {/* ---------- CONSENT ----------
          Not decoration. India's DPDP Act 2023 requires clear, specific,
          informed consent before processing a person's image, and the plain
          truth here is also the best sales line in the whole kiosk. */}
      {stage === "consent" && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-void px-margin py-space-xl">
          <div className="w-full max-w-lg">
          <Monogram className="h-10 w-auto" />

          <div className="mt-space-xl">
            <h2 className="rise font-display text-display-md leading-tight text-bone">
              Before we begin.
            </h2>
            <div className="mt-space-lg flex flex-col gap-space-md">
              {[
                ["The camera takes one still", "Only when you tap a garment, and only after a countdown you can walk away from."],
                ["It is used once, then dropped", "Your photo goes to the fitting engine, comes back as a look, and is never written to disk."],
                ["Nothing is kept about you", "No face data, no account, no record that you stood here. The look you scan expires in fifteen minutes."],
              ].map(([h, b], i) => (
                <div key={h} className="fade-up flex gap-space-md" style={{ animationDelay: `${140 + i * 90}ms` }}>
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-champagne" />
                  <div>
                    <p className="font-body text-body-lg text-bone">{h}</p>
                    <p className="mt-1 font-body text-body-sm text-muted">{b}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="fade-up mt-space-xl flex flex-col items-start gap-space-md" style={{ animationDelay: "480ms" }}>
            <button onClick={accept} className="btn-primary">I understand — begin</button>
            <button onClick={() => setStage("attract")} className="eyebrow text-muted">Not now</button>
          </div>
          </div>
        </div>
      )}

      {/* ---------- MIRROR ---------- */}
      {stage === "mirror" && (
        <>
          <Silhouette />
          <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-margin pt-space-lg pb-space-lg"
            style={{ background: "linear-gradient(to bottom, rgba(8,9,11,0.85) 0%, rgba(8,9,11,0) 100%)" }}>
            <BrandMark />
            <button
              onClick={() => setStage("attract")}
              className="eyebrow text-bone/70 transition-colors duration-200 hover:text-bone"
            >
              Done
            </button>
          </header>

          {camError && (
            <div className="absolute inset-x-0 top-[88px] z-30 flex justify-center px-margin">
              <p className="eyebrow rounded-full border border-border-subtle bg-surface/80 px-4 py-2 text-muted backdrop-blur-md">
                {camError === "denied" ? "Camera blocked — showing a sample" : "No camera — showing a sample"}
              </p>
            </div>
          )}

          {/* garment rail */}
          <div className="absolute inset-x-0 bottom-0 z-30 pb-space-lg">
            <div
              className="absolute inset-x-0 bottom-0 h-[340px]"
              style={{ background: "linear-gradient(to top, #08090B 20%, rgba(8,9,11,0.7) 55%, transparent 100%)" }}
            />
            <div className="relative px-margin pb-space-sm">
              <span className="eyebrow text-muted">This week&apos;s rail</span>
            </div>
            <div
              ref={railRef}
              className="relative flex gap-space-sm overflow-x-auto px-margin pb-2"
              style={{ scrollSnapType: "x mandatory" }}
            >
              {garments.map((g, i) => (
                <button
                  key={g.id}
                  onClick={() => pick(g)}
                  className="group rise w-[164px] shrink-0 text-left transition-transform duration-200 hover:-translate-y-1"
                  style={{ animationDelay: `${i * 45}ms`, scrollSnapAlign: "start" }}
                >
                  <div className="overflow-hidden rounded-media border border-border-subtle bg-surface transition-colors duration-200 group-hover:border-champagne/60">
                    <img
                      src={g.image} alt={g.name}
                      className="aspect-[3/4] w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <p className="mt-space-sm font-body text-body-sm text-bone">{g.name}</p>
                  <p className="eyebrow mt-1 text-muted">{inr(g.price)}</p>
                </button>
              ))}
            </div>
            {lookbook.length > 0 && (
              <div className="relative mt-space-sm px-margin">
                <button onClick={() => setStage("lookbook")} className="eyebrow text-champagne underline-offset-4 hover:underline">
                  {lookbook.length} look{lookbook.length > 1 ? "s" : ""} tried — see them together
                </button>
              </div>
            )}
          </div>
        </>
      )}


      {/* ---------- LOOK BOOK ----------
          The comparison moment. A customer who can see four looks at once
          buys one of them far more often than one who saw them one at a time. */}
      {stage === "lookbook" && (
        <div className="absolute inset-0 z-40 flex flex-col bg-void px-margin pt-space-lg pb-space-lg">
          <header className="flex items-center justify-between">
            <BrandMark strong />
            <button onClick={() => setStage("mirror")} className="eyebrow text-bone/70">Close</button>
          </header>

          <h2 className="rise mt-space-lg font-display text-display-md text-bone">
            {lookbook.length === 1 ? "Your look" : `Your ${["", "one", "two", "three", "four", "five", "six"][lookbook.length] || lookbook.length} looks`}
          </h2>
          <p className="fade-up mt-2 font-body text-body-sm text-muted" style={{ animationDelay: "120ms" }}>
            Tap one to see it full size.
          </p>

          <div className="mt-space-lg grid grid-cols-2 gap-space-sm overflow-y-auto content-start">
            {lookbook.map((l, i) => (
              <button
                key={l.id}
                onClick={() => {
                  setSelected(l); setResult(l.image); setResultOn(false);
                  setCaptured(null); setQr(null); setMeta({ demo: true });
                  setStage("result");
                  requestAnimationFrame(() => requestAnimationFrame(() => setResultOn(true)));
                }}
                className="rise relative overflow-hidden rounded-media border border-border-subtle bg-surface text-left"
                style={{ animationDelay: `${i * 45}ms` }}
              >
                <img src={l.image} alt={l.name} className="aspect-[9/16] w-full object-cover" />
                <div
                  className="absolute inset-x-0 bottom-0 px-3 pb-3 pt-16"
                  style={{ background: "linear-gradient(to top, #08090B 10%, rgba(8,9,11,0.7) 50%, transparent 100%)" }}
                >
                  <p className="font-body text-body-sm text-bone">{l.name}</p>
                  <p className="eyebrow mt-1 text-muted">{inr(l.price)}</p>
                </div>
              </button>
            ))}
          </div>

          <button onClick={() => setStage("mirror")} className="btn-primary mt-space-xl self-start">
            Try another
          </button>
        </div>
      )}

      {/* ---------- COUNTDOWN ---------- */}
      {stage === "countdown" && (
        <div className="scrim absolute inset-0 z-40 flex flex-col items-center justify-center">
          <span
            key={count}
            className="count-in relative font-display text-[clamp(88px,20vw,220px)] leading-none text-bone"
          >
            {count > 0 ? count : ""}
          </span>
          <p className="relative mt-space-lg font-body text-title-md text-muted">
            Hold still — any angle works
          </p>
          <div className="relative mt-space-xl flex items-center gap-space-sm">
            <img
              src={selected.image} alt=""
              className="h-16 w-12 rounded object-cover ring-2 ring-champagne"
            />
            <span className="font-body text-body-sm text-bone">{selected.name}</span>
          </div>
        </div>
      )}

      {/* ---------- SHUTTER ---------- */}
      {flash && <div className="shutter pointer-events-none absolute inset-0 z-50 bg-white" />}

      {/* ---------- WORKING ---------- */}
      {stage === "working" && (
        <div className="scrim absolute inset-0 z-40 flex flex-col items-center justify-center">
          <div className="relative">
            <ProgressArc startedAt={workStart} />
            <span className="absolute left-1/2 top-1/2 h-[92px] w-[70px] -translate-x-1/2 -translate-y-1/2">
              <img
                src={selected.image} alt=""
                className="breathe h-full w-full rounded-md object-cover ring-1 ring-champagne/40"
              />
            </span>
          </div>
          <p className="relative mt-space-xl font-display text-headline-lg text-bone">
            Draping {selected.name.toLowerCase()}
          </p>
          <p className="relative mt-space-sm font-body text-body-sm text-muted">
            A moment — the fabric is finding your shape
          </p>
          <div className="relative mt-space-lg"><BrandMark /></div>
        </div>
      )}

      {/* ---------- RESULT ---------- */}
      {stage === "result" && result && (
        <>
          <img
            src={result} alt={selected.name}
            className={`hero-in absolute inset-0 z-[2] h-full w-full object-cover ${resultOn ? "on" : ""}`}
          />
          {compare && captured && (
            <div
              className="absolute inset-0 z-[3] overflow-hidden"
              style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
            >
              <img src={captured} alt="" className="h-full w-full object-cover" />
              <span className="eyebrow absolute left-margin top-1/2 rounded-full bg-void/70 px-3 py-1.5 text-bone backdrop-blur-md">Before</span>
            </div>
          )}
          {compare && (
            <>
              <div
                className="absolute inset-y-0 z-[4] w-[2px] bg-champagne"
                style={{ left: `${split}%` }}
              />
              <input
                type="range" min="0" max="100" value={split}
                onChange={(e) => setSplit(Number(e.target.value))}
                className="absolute inset-x-0 top-1/2 z-[5] h-12 w-full cursor-ew-resize opacity-0"
                aria-label="Compare before and after"
              />
            </>
          )}

          <div
            className="absolute inset-0 z-[6] pointer-events-none"
            style={{ background: "linear-gradient(to bottom, rgba(8,9,11,0.7) 0%, transparent 28%, transparent 55%, rgba(8,9,11,0.95) 100%)" }}
          />

          <header
            className="fade-up absolute inset-x-0 top-0 z-30 flex items-center justify-between px-margin pt-space-lg"
            style={{ animationDelay: `${HERO_MS * 0.32}ms` }}
          >
            <div className="flex flex-col gap-1.5">
              <BrandMark strong />
              <Monogram className="h-7 w-auto" />
            </div>
            <span className="eyebrow text-muted">Your look</span>
          </header>

          <div className="absolute inset-x-0 bottom-0 z-30 flex flex-col px-margin pb-space-xl">
            <div
              className="fade-up flex items-end justify-between"
              style={{ animationDelay: `${HERO_MS * 0.32 + 60}ms` }}
            >
              <div>
                <p className="eyebrow text-champagne">{selected.fabric}</p>
                <h2 className="mt-space-xs font-display text-display-md text-bone">{selected.name}</h2>
                <p className="mt-1 font-body text-title-md text-muted">{inr(selected.price)}</p>
                {meta?.verified === true && (
                  <p className="eyebrow mt-space-sm text-confirm">✓ Fit verified</p>
                )}
                {meta?.demo && (
                  <p className="eyebrow mt-space-sm text-muted">Demo look</p>
                )}
              </div>
              {qr && (
                <div
                  className="fade-up flex w-[140px] flex-col items-center gap-2 rounded-card border border-border-subtle bg-surface p-3 shadow-lift"
                  style={{ animationDelay: `${HERO_MS * 0.32 + 120}ms` }}
                >
                  <img src={qr} alt="Scan to keep this look" className="w-full rounded-md" />
                  <span className="eyebrow text-center text-muted">Scan to keep</span>
                </div>
              )}
            </div>

            <div
              className="fade-up mt-space-lg flex items-center gap-space-sm"
              style={{ animationDelay: `${HERO_MS * 0.32 + 180}ms` }}
            >
              <button onClick={backToMirror} className="btn-primary">Try another</button>
              {captured && (
                <button onClick={() => setCompare((c) => !c)} className="btn-ghost">
                  {compare ? "Hide before" : "Compare"}
                </button>
              )}
            </div>

            {meta?.costInr > 0 && (
              <p className="eyebrow mt-space-md text-muted/50">
                {meta.mode} · {(meta.totalMs / 1000).toFixed(1)}s · ₹{meta.costInr}
              </p>
            )}
          </div>
        </>
      )}

      {/* ---------- FAILED ---------- */}
      {stage === "failed" && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-void px-margin text-center">
          <Monogram className="h-9 w-auto" />
          <h2 className="rise mt-space-xl font-display text-display-md text-bone">
            That look didn&apos;t come through.
          </h2>
          <p className="fade-up mt-space-md max-w-sm font-body text-body-lg text-muted" style={{ animationDelay: "120ms" }}>
            {err}
          </p>
          <div className="fade-up mt-space-xl flex gap-space-sm" style={{ animationDelay: "240ms" }}>
            <button onClick={() => pick(selected)} className="btn-primary">Try again</button>
            <button onClick={backToMirror} className="btn-ghost">Back to mirror</button>
          </div>
        </div>
      )}

      {/* ---------- the promise, always visible on the mirror ---------- */}
      {(stage === "mirror" || stage === "countdown") && (
        <p className="eyebrow absolute inset-x-0 bottom-2 z-40 text-center text-muted/40">
          Your photo is never stored
        </p>
      )}
    </div>
  );
}
