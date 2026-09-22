"use client";

import { useEffect, useState } from "react";
import { Monogram } from "./Brand";
import { Arrow } from "./Nav";
import { GARMENTS } from "@/lib/catalogue";

// The landing answers three questions in the order a customer asks them:
// what does it do (the live before/after), how (three steps), and how
// long (the numbers). Then one button, and a line saying what it opens.

const DEMO = [
  { src: "/looks/look-crimson.jpg", name: "Banarasi Silk Saree", tone: "Deep Wine" },
  { src: "/looks/look-emerald.jpg", name: "Zardozi Lehenga Choli", tone: "Bottle Green" },
  { src: "/looks/look-ivory.jpg", name: "Banarasi Silk Saree", tone: "Champagne Gold" },
  { src: "/looks/look-midnight.jpg", name: "Floor-Length Anarkali", tone: "Midnight Navy" },
];

const HOW = [
  { n: "01", title: "Stand & capture", body: "A five-second timer, then one full-length photo." },
  { n: "02", title: "Choose a piece", body: "Pick any garment and colourway from the rail." },
  { n: "03", title: "See it on you", body: "Compare before and after, then scan to keep it." },
];

const colourways = GARMENTS.reduce((n, g) => n + g.colourways.length, 0);

function DemoMirror() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % DEMO.length), 4200);
    return () => clearInterval(t);
  }, []);
  const look = DEMO[i];

  return (
    <div className="demo-mirror fade-up" style={{ animationDelay: "500ms" }}>
      <img src="/looks/mirror-feed.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
      {/* Remounted per look so the wipe replays from the left each time. */}
      <div key={i} className="demo-after">
        <img src={look.src} alt={`Try-on: ${look.name}`} className="h-full w-full object-cover" />
      </div>
      <span key={`l${i}`} className="demo-scan" />
      <span className="demo-tag left-[3%]">Before</span>
      <span className="demo-tag right-[3%] text-void !bg-champagne">After</span>
      <div className="demo-caption">
        <p key={`c${i}`} className="fade-up">
          <span className="block font-display text-[clamp(13px,2.6cqw,20px)] leading-tight text-bone">{look.name}</span>
          <span className="block text-[clamp(10px,1.8cqw,13px)] text-champagne">{look.tone}</span>
        </p>
        <div className="flex gap-[5px]">
          {DEMO.map((_, j) => (
            <span key={j} className={`demo-dot ${j === i ? "on" : ""}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Welcome({ onBegin }) {
  return (
    <div className="welcome">
      <div className="poster-ambient" />

      <header className="relative flex flex-col items-center text-center">
        <Monogram className="letter-in h-[clamp(28px,6cqw,44px)] w-auto" />
        <h1 className="fade-up mt-[1.6cqw] font-display text-[clamp(34px,9cqw,68px)] leading-[1.02] text-bone" style={{ animationDelay: "150ms" }}>
          See it on you.
        </h1>
        <p className="fade-up mt-[1.4cqw] max-w-[70cqw] text-[clamp(13px,2.5cqw,18px)] font-light leading-[1.45] text-muted" style={{ animationDelay: "250ms" }}>
          One photograph. Any piece in the house — draped on your own body, in your own light.
        </p>
      </header>

      <section className="welcome-grid">
        <DemoMirror />
        <ol className="flex flex-col justify-center gap-[clamp(10px,2.6cqw,22px)]">
          {HOW.map((s, k) => (
            <li key={s.n} className="welcome-step fade-up" style={{ animationDelay: `${650 + k * 110}ms` }}>
              <span className="welcome-step-n">{s.n}</span>
              <span className="min-w-0">
                <span className="block text-[clamp(13px,2.6cqw,19px)] font-semibold leading-tight text-bone">{s.title}</span>
                <span className="mt-[0.3em] block text-[clamp(11px,2.1cqw,15px)] leading-[1.4] text-muted">{s.body}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <dl className="welcome-stats fade-up" style={{ animationDelay: "1000ms" }}>
        {[
          [GARMENTS.length, "pieces"],
          [colourways, "colourways"],
          ["~20", "seconds a look"],
        ].map(([v, l]) => (
          <div key={l} className="flex flex-col items-center">
            <dt className="font-display text-[clamp(20px,4.6cqw,34px)] leading-none text-champagne">{v}</dt>
            <dd className="mt-[0.5em] text-[clamp(9px,1.7cqw,12px)] font-semibold uppercase tracking-[0.24em] text-muted">{l}</dd>
          </div>
        ))}
      </dl>

      <div className="fade-up relative flex flex-col items-center" style={{ animationDelay: "1150ms" }}>
        <button type="button" onClick={onBegin} className="cta">
          Try it on yourself
          <span className="cta-icon">
            <Arrow dir="right" />
          </span>
        </button>
        <p className="mt-[1.4cqw] text-[clamp(10px,1.8cqw,13px)] tracking-[0.04em] text-muted">
          <span className="text-champagne">Next · Capture</span> — the camera opens with a 5-second timer.
        </p>
      </div>

      <p className="relative text-center text-[clamp(9px,1.6cqw,11px)] font-semibold uppercase tracking-[0.32em] text-champagne/70">
        Made by Smit Kapadiya
      </p>
    </div>
  );
}
