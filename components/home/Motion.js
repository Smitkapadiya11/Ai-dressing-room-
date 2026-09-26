"use client";
import { useEffect } from "react";

// One observer for every .k-reveal, one rAF-throttled scroll listener for
// the nav and the founder thread. Reduced motion: everything is shown at once.
export default function Motion() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const els = document.querySelectorAll(".k-reveal, [data-reveal]");
    const io =
      !reduce && "IntersectionObserver" in window
        ? new IntersectionObserver(
            (entries) =>
              entries.forEach((e) => {
                if (e.isIntersecting) {
                  e.target.classList.add("is-in");
                  io.unobserve(e.target);
                }
              }),
            { rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
          )
        : null;
    els.forEach((el) => (io ? io.observe(el) : el.classList.add("is-in")));

    const nav = document.querySelector(".k-nav");
    const thread = document.querySelector(".k-thread");
    let raf = 0;
    const tick = () => {
      raf = 0;
      nav?.classList.toggle("is-solid", window.scrollY > 24);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      document.documentElement.style.setProperty("--scroll", max > 0 ? (window.scrollY / max).toFixed(4) : "0");
      if (thread && !reduce) {
        const r = thread.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, (window.innerHeight * 0.7 - r.top) / r.height));
        thread.style.setProperty("--p", p.toFixed(3));
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    tick();
    // Cards light up under the finger / cursor.
    const onMove = (e) => {
      const card = e.target.closest?.(".k-feat__item, .k-reason, .k-tier, .k-step");
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io?.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);
  return null;
}
