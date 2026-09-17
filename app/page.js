"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Poster from "@/components/Poster";
import Welcome from "@/components/Welcome";
import TryOn from "@/components/TryOn";
import { SHOP } from "@/lib/shop";

export default function KioskPage() {
  const [screen, setScreen] = useState("poster"); // poster | welcome | tryon
  const idleTimer = useRef(null);

  const returnToPoster = useCallback(() => setScreen("poster"), []);

  // Anywhere past the Poster, 90s of nothing sends the customer back to it.
  const poke = useCallback(() => {
    clearTimeout(idleTimer.current);
    if (screen === "poster") return;
    idleTimer.current = setTimeout(returnToPoster, SHOP.idleReturnMs);
  }, [screen, returnToPoster]);

  useEffect(() => {
    poke();
    return () => clearTimeout(idleTimer.current);
  }, [poke]);

  // The whole Poster is one tap target — any touch or key press leaves idle.
  useEffect(() => {
    if (screen !== "poster") return;
    const wake = () => setScreen("welcome");
    window.addEventListener("pointerdown", wake);
    window.addEventListener("keydown", wake);
    return () => {
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("keydown", wake);
    };
  }, [screen]);

  return (
    <div className="stage" onPointerDown={poke} onPointerMove={poke}>
      <div className="panel">
        {screen === "poster" && <Poster mode="idle" />}
        {screen === "welcome" && <Welcome onBegin={() => setScreen("tryon")} />}
        {screen === "tryon" && <TryOn onExit={returnToPoster} />}
      </div>
    </div>
  );
}
