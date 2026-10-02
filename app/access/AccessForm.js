"use client";

import { useState } from "react";
import { safeNext } from "@/lib/access";

export default function AccessForm({ next }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!password.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        window.location.replace(safeNext(next));
        return;
      }
      setError(data.error || "Something went wrong. Try again.");
    } catch {
      setError("No connection. Check the network and try again.");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="flex w-full max-w-xs flex-col gap-3">
      <input
        type="password"
        inputMode="numeric"
        autoComplete="current-password"
        autoFocus
        aria-label="Access password"
        placeholder="Access password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-center font-body text-bone outline-none focus:border-white/40"
      />
      {error && <p role="alert" className="font-body text-sm text-red-300">{error}</p>}
      <button type="submit" className="btn-primary" disabled={busy}>
        {busy ? "Checking…" : "Step in"}
      </button>
    </form>
  );
}
