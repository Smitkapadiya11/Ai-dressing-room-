"use client";

// The kiosk's one navigation system, drawn above every stage past the
// poster: Back on the left, Next on the right — each says where it goes —
// and a four-step progress rail between them. A disabled Next still names
// the next step, so she always knows what comes after this screen.

export const STEPS = ["Welcome", "Capture", "Choose", "Your look"];

export function Arrow({ dir = "right", className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d={dir === "right" ? "M9 5l7 7-7 7" : "M15 5l-7 7 7 7"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NavButton({ dir, label, hint, onClick, disabled }) {
  const next = dir === "next";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`nav-btn ${next ? "nav-btn-next" : ""}`}
      aria-label={`${next ? "Next" : "Back"}: ${label}`}
    >
      {!next && (
        <span className="nav-btn-icon">
          <Arrow dir="left" />
        </span>
      )}
      <span className={`flex min-w-0 flex-col ${next ? "items-end text-right" : "items-start text-left"}`}>
        <span className="nav-btn-hint">{hint || (next ? "Next" : "Back")}</span>
        <span className="nav-btn-label">{label}</span>
      </span>
      {next && (
        <span className="nav-btn-icon">
          <Arrow dir="right" />
        </span>
      )}
    </button>
  );
}

// step: 0-based index into STEPS. prev/next: { label, onClick, disabled?, hint? } or null.
export default function TopNav({ step, prev, next, onClose, busy = false }) {
  return (
    <nav className="topnav" aria-label="Steps">
      <div className="topnav-row">
        <div className="topnav-side">
          {prev && <NavButton dir="prev" {...prev} />}
        </div>

        <div className="topnav-side justify-end">
          {next && <NavButton dir="next" {...next} />}
          <button type="button" onClick={onClose} aria-label="Start over" className="topnav-close">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
      <div className="topnav-steps" aria-live="polite">
        <div className="flex w-full gap-[6px]">
          {STEPS.map((s, i) => (
            <span key={s} className={`topnav-seg ${i < step ? "done" : ""} ${i === step ? "active" : ""} ${busy && i === step ? "busy" : ""}`}>
              <span />
            </span>
          ))}
        </div>
        <p className="topnav-caption">
          <span className="text-champagne">{String(step + 1).padStart(2, "0")}</span>
          <span className="opacity-40"> / {String(STEPS.length).padStart(2, "0")}</span>
          <span className="mx-[0.6em] opacity-40">·</span>
          {STEPS[step]}
        </p>
      </div>

    </nav>
  );
}
