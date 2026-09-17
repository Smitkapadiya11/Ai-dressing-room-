"use client";

import { useCallback, useRef, useState } from "react";
import Camera from "./Camera";
import Countdown from "./Countdown";
import GarmentPicker from "./GarmentPicker";
import Poster from "./Poster";

const STATUS_LINES = [
  "Reading your frame",
  "Measuring shoulder to hem",
  "Matching the weave",
  "Draping the fabric",
  "Setting the fall of the pleats",
  "Matching the light in the room",
  "Finishing",
];

export default function TryOn({ onExit }) {
  const [step, setStep] = useState("camera"); // camera | countdown | picking | working | done | error
  const [statusIndex, setStatusIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [verified, setVerified] = useState(null);
  const [error, setError] = useState(null);

  const cameraRef = useRef(null);
  const capturedRef = useRef(null);
  // TRICK ONE lives here: this holds the body-read response once it
  // resolves, but nothing ever awaits it. If pick() runs before this is
  // set, the generate call just goes out without it.
  const bodyReadRef = useRef(null);
  const cycleRef = useRef(null);

  const onCameraReady = useCallback(() => setStep("countdown"), []);

  const onFrame = useCallback((dataUrl) => {
    capturedRef.current = dataUrl;
    bodyReadRef.current = null;
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
    setStep("picking");
  }, []);

  const onCountdownDone = useCallback(() => {
    cameraRef.current?.capture();
  }, []);

  async function pick(garment, colourway) {
    setStep("working");
    setStatusIndex(0);
    setError(null);
    setVerified(null);

    clearInterval(cycleRef.current);
    cycleRef.current = setInterval(() => {
      setStatusIndex((i) => Math.min(i + 1, STATUS_LINES.length - 1));
    }, 2600);

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
      setStep("done");

      // TRICK TWO — verify only after the picture is already on screen.
      if (data.bodyRead) {
        fetch("/api/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: data.image, bodyRead: data.bodyRead }),
        })
          .then((r) => r.json())
          .then((v) => {
            setTimeout(() => setVerified(v.match === true), 2000);
          })
          .catch(() => {});
      }
    } catch (e) {
      clearInterval(cycleRef.current);
      setError(e.message || "That look did not come through.");
      setStep("error");
    }
  }

  function tryAnother() {
    setResult(null);
    setVerified(null);
    setError(null);
    setStep("picking");
  }

  return (
    <div className="absolute inset-0">
      {(step === "camera" || step === "countdown") && (
        <Camera ref={cameraRef} onReady={onCameraReady} onFrame={onFrame} />
      )}
      {step === "countdown" && <Countdown onDone={onCountdownDone} />}

      {step === "picking" && <GarmentPicker onPick={pick} />}

      {step === "working" && <Poster mode="working" status={STATUS_LINES[statusIndex]} />}

      {step === "done" && result && (
        <div className="absolute inset-0 flex flex-col items-center bg-void">
          <img src={result.image} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-[2cqw] px-[4cqw] pb-[6cqw]">
            {verified === true && (
              <p className="font-body text-[1.4cqw] leading-none text-confirm">✓ Fit verified</p>
            )}
            <button onClick={tryAnother} className="btn-primary text-[1.6cqw] leading-none">
              Try another
            </button>
          </div>
        </div>
      )}

      {step === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-[3cqw] bg-void px-[8cqw] text-center">
          <p className="font-body text-[2.2cqw] leading-[1.4] text-bone">{error}</p>
          <button onClick={tryAnother} className="btn-primary text-[1.6cqw] leading-none">
            Back to the rail
          </button>
        </div>
      )}

      <button
        onClick={onExit}
        className="absolute right-[3cqw] top-[3cqw] z-30 font-body text-[1.2cqw] leading-none uppercase tracking-[0.2em] text-muted"
      >
        Close
      </button>
    </div>
  );
}
