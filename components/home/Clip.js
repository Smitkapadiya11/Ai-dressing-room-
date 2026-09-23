"use client";
import { useEffect, useRef } from "react";

// Muted looping video that loads and plays only while on screen, and
// pauses off screen. Reduced motion: the poster stays, nothing plays.
// `concept` adds the "Concept visualisation" caption the asset kit requires
// on any AI video that shows a try-on result.
export default function Clip({ src, className = "", concept = false, label }) {
  const ref = useRef(null);

  useEffect(() => {
    const v = ref.current;
    if (!v || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          if (v.preload === "none") {
            v.preload = "auto";
            v.load();
          }
          v.play().catch(() => {});
        } else v.pause();
      },
      { threshold: 0.15 }
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return (
    <div className={`k-clip ${className}`}>
      <video ref={ref} muted loop playsInline preload="none" poster={src.poster || undefined} aria-label={label} aria-hidden={label ? undefined : true}>
        {src.webm && <source src={src.webm} type="video/webm" />}
        {src.mp4 && <source src={src.mp4} type="video/mp4" />}
      </video>
      {concept && <span className="k-concept">Concept visualisation</span>}
    </div>
  );
}
