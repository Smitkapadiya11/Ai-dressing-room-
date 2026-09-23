"use client";

import { useState } from "react";

// A small chip at the foot of the garment drawer. Tapping it slides up a
// compact list of the engines the server says are configured. The choice
// goes with the next fitting; the server re-checks it.
export default function ModelPicker({ engines, value, onChange }) {
  const [open, setOpen] = useState(false);
  if (!engines || engines.length < 2) return null;
  const current = engines.find((e) => e.id === value) || engines[0];

  return (
    <>
      <button type="button" className="model-chip" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="model-chip-dot" />
        <span className="text-muted">Engine</span>
        <span className="text-bone">{current.label}</span>
      </button>

      {open && <button type="button" aria-label="Close engine list" className="model-scrim" onClick={() => setOpen(false)} />}
      <div className={`model-drawer ${open ? "open" : ""}`} role="dialog" aria-label="Choose AI engine" aria-hidden={!open}>
        <p className="model-drawer-title">Render with</p>
        {engines.map((e) => (
          <button
            type="button"
            key={e.id}
            tabIndex={open ? 0 : -1}
            aria-pressed={e.id === current.id}
            className={`model-option ${e.id === current.id ? "on" : ""}`}
            onClick={() => {
              onChange(e.id);
              setOpen(false);
            }}
          >
            <span className="text-bone">{e.label}</span>
            <span className="text-muted">{e.vendor || e.model}</span>
          </button>
        ))}
      </div>
    </>
  );
}
