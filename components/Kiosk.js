"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Poster from "./Poster";
import Welcome from "./Welcome";
import Camera from "./Camera";
import Countdown from "./Countdown";
import Drawer from "./Drawer";
import Result from "./Result";
import { SHOP } from "@/lib/shop";

// ============================================================
//  THE WHOLE CUSTOMER JOURNEY, in one state machine:
//
//    poster -> welcome -> countdown -> drawer -> working -> result -> (drawer)
//
//  The Poster is both the first state and the working state — same
//  component, two modes, so the screen never has a dead moment.
//
//  90 seconds of no touch, anywhere, returns to poster and clears the
//  session (photo, body read, everything). A fresh customer must never
//  see the last one's reading.
// ============================================================

const STATUS_LINES = [
  "Reading your frame",
  "Measuring shoulder to hem",
  "Matching the weave",
  "Draping the fabric",
  "Setting the fall of the pleats",
  "Matching the light in the room",
  "Finishing",
];

export default function Kiosk() {
  const [stage, setStage] = useState("poster");
  const [cameraReady, setCameraReady] = useState(false);
  const [statusIndex, setStatusIndex] = useState(0);
  const [pick, setPick] = useState(null); // { garment, colourway }
  const [result, setResult] = useState(null);
  const [verified, setVerified] = useState(null);
  const [error, setError] = useState(null);

  const capturedRef = useRef(null);
  // TRICK ONE lives here: holds the body-read response once it resolves,
  // but nothing ever awaits it. If runFit() runs before this is set, the
  // generate call just goes out without it.
  const bodyReadRef = useRef(null);
  const cameraRef = useRef(null);
  const cycleRef = useRef(null);
  const idleTimer = useRef(null);

  const clearSession = useCallback(() => {
    capturedRef.current = null;
    bodyReadRef.current = null;
    setPick(null);
    setResult(null);
    setVerified(null);
    setError(null);
    setCameraReady(false);
  }, []);

  const goToPoster = useCallback(() => {
    clearInterval(cycleRef.current);
    clearSession();
    setStage("poster");
  }, [clearSession]);

  // 90s of nothing, anywhere past the poster, sends her back to it.
  const poke = useCallback(() => {
    clearTimeout(idleTimer.current);
    if (stage === "poster") return;
    idleTimer.current = setTimeout(goToPoster, SHOP.idleReturnMs);
  }, [stage, goToPoster]);

  useEffect(() => {
    poke();
    return () => clearTimeout(idleTimer.current);
  }, [poke]);

  // Any touch or key press leaves the poster.
  useEffect(() => {
    if (stage !== "poster") return;
    const wake = () => setStage("welcome");
    window.addEventListener("pointerdown", wake);
    window.addEventListener("keydown", wake);
    return () => {
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("keydown", wake);
    };
  }, [stage]);

  // Escape is the keyboard equivalent of the close control below — a
  // laptop trackpad in front of an investor is a mouse, not a finger.
  useEffect(() => {
    if (stage === "poster") return;
    const onKey = (e) => e.key === "Escape" && goToPoster();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stage, goToPoster]);

  const onCameraReady = useCallback(() => setCameraReady(true), []);

  const onFrame = useCallback((dataUrl) => {
    capturedRef.current = dataUrl;
    bodyReadRef.current = null;
    // TRICK ONE — fire the body read in the background, right now, and
    // open the drawer immediately. She spends 5-15s choosing; by the
    // time she taps a garment the reading is usually already in hand.
    fetch("/api/body-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ person: dataUrl }),
    })
      .then((r) => r.json())
      .then((data) => {
        bodyReadRef.current = data;
      })
      .catch(() => {
        bodyReadRef.current = { bodyRead: null };
      });
    setStage("drawer");
  }, []);

  const onCountdownDone = useCallback(() => {
    cameraRef.current?.capture();
  }, []);

  async function runFit(garment, colourway) {
    setPick({ garment, colourway });
    setError(null);
    setVerified(null);
    setStatusIndex(0);
    setStage("working");

    clearInterval(cycleRef.current);
    cycleRef.current = setInterval(() => {
      setStatusIndex((i) => Math.min(i + 1, STATUS_LINES.length - 1));
    }, 2600);

    // Never awaited — if it hasn't resolved by the time she picks, the
    // generate just goes out without it.
    const bodyRead = bodyReadRef.current?.bodyRead || null;

    try {
      const res = await fetch("/api/tryon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          person: capturedRef.current,
          garmentId: garment.id,
          colourway: colourway?.name,
          bodyRead,
        }),
      });
      const data = await res.json();
      clearInterval(cycleRef.current);
      if (!res.ok) throw new Error(data.error || "That look did not come through.");

      setResult(data);
      setStage("result");

      // TRICK TWO — verify only after the picture is already on screen.
      if (data.bodyRead) {
        fetch("/api/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: data.image, bodyRead: data.bodyRead }),
        })
          .then((r) => r.json())
          .then((v) => setTimeout(() => setVerified(v.match === true), 2000))
          .catch(() => {});
      }
    } catch (e) {
      clearInterval(cycleRef.current);
      setError(e.message || "That look did not come through.");
      setStage("drawer");
    }
  }

  return (
    <div className="stage" onPointerDown={poke} onPointerMove={poke}>
      <div className="panel">
        {stage === "poster" && <Poster mode="idle" />}

        {stage === "welcome" && (
          <Welcome
            onBegin={() => {
              setCameraReady(false);
              setStage("countdown");
            }}
          />
        )}

        {stage === "countdown" && (
          <>
            <Camera ref={cameraRef} onReady={onCameraReady} onFrame={onFrame} />
            {cameraReady && <Countdown onDone={onCountdownDone} />}
          </>
        )}

        {stage === "drawer" && (
          <>
            {error && (
              <p className="kiosk-error absolute inset-x-[6cqw] top-[2.4cqw] z-10 text-center font-body text-[1.3cqw] leading-[1.4] text-bone">
                {error}
              </p>
            )}
            <Drawer capturedPhoto={capturedRef.current} onPick={runFit} />
          </>
        )}

        {stage === "working" && <Poster mode="working" status={STATUS_LINES[statusIndex]} />}

        {stage === "result" && result && pick && (
          <Result
            capturedPhoto={capturedRef.current}
            garment={pick.garment}
            colourway={pick.colourway}
            result={result}
            verified={verified}
            onTryAnother={() => setStage("drawer")}
            onPickRecommendation={runFit}
          />
        )}

        {stage !== "poster" && (
          <button onClick={goToPoster} aria-label="Start over" className="kiosk-close absolute right-[2.4cqw] top-[2.4cqw] z-40">
            <svg viewBox="0 0 24 24" className="h-[4.2cqw] w-[4.2cqw]" fill="none">
              <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
