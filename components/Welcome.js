"use client";

import { Monogram } from "./Brand";
import { SHOP } from "@/lib/shop";

export default function Welcome({ onBegin }) {
  const word = SHOP.name.split("");

  return (
    <div className="relative flex h-full w-full flex-col items-center px-[6cqw] py-[6cqw]">
      <div className="poster-ambient" />

      <div className="relative flex flex-col items-center pt-[2cqw]">
        <Monogram className="letter-in h-[6cqw] w-auto" />
        <div className="mt-[2cqw] flex">
          {word.map((c, i) => (
            <span
              key={i}
              className="letter-in font-display text-[7cqw] leading-none uppercase text-bone"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              {c === " " ? " " : c}
            </span>
          ))}
        </div>
        <span className="welcome-hairline mt-[2.4cqw]" style={{ animationDelay: "600ms" }} />
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center text-center">
        <h1 className="fade-up font-display text-[9cqw] leading-tight text-bone" style={{ animationDelay: "900ms" }}>
          See it on you.
        </h1>
        <p
          className="fade-up mt-[1.4cqw] font-body text-[2cqw] leading-[1.4] font-light tracking-[0.03em] text-muted"
          style={{ animationDelay: "1050ms" }}
        >
          One photograph. Any piece in the house.
        </p>
      </div>

      <div className="relative flex flex-col items-center pb-[8cqw]">
        <button
          onClick={onBegin}
          className="fade-up btn-primary flex items-center justify-center text-[1.6cqw] leading-none"
          style={{ animationDelay: "1200ms", padding: "0 4cqw", minHeight: "11.3cqw" }}
        >
          Try it on yourself
        </button>
      </div>

      <div
        className="fade-up absolute bottom-[3cqw] right-[4cqw] flex flex-col items-end gap-[0.8cqw]"
        style={{ animationDelay: "1800ms" }}
      >
        <span className="h-px w-[10cqw] bg-champagne/70" />
        <p className="font-body text-[1.2cqw] leading-none font-semibold uppercase tracking-[0.32em] text-champagne">
          Made by Smit Kapadiya
        </p>
      </div>
    </div>
  );
}
