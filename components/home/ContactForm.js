"use client";
import { useState } from "react";

const FIELDS = [
  { name: "name", label: "Your name", required: true, autoComplete: "name" },
  { name: "shop", label: "Shop name", autoComplete: "organization" },
  { name: "city", label: "City", autoComplete: "address-level2" },
  { name: "phone", label: "Phone / WhatsApp", required: true, type: "tel", autoComplete: "tel" },
  { name: "outlets", label: "Number of outlets", type: "number", inputMode: "numeric" },
];

// If the email route isn't configured yet (no Resend key), the enquiry is
// handed to WhatsApp, pre-filled, so no lead is ever lost.
function toWhatsApp(number, body) {
  const lines = [
    "Hello, I'd like a demo of the try-on mirror.",
    body.name && `Name: ${body.name}`,
    body.shop && `Shop: ${body.shop}`,
    body.city && `City: ${body.city}`,
    body.phone && `Phone: ${body.phone}`,
    body.outlets && `Outlets: ${body.outlets}`,
    body.message && `\n${body.message}`,
  ].filter(Boolean);
  window.open(`https://wa.me/${number}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank", "noopener");
}

export default function ContactForm({ whatsapp }) {
  const [state, setState] = useState({ status: "idle", msg: "" });

  async function submit(e) {
    e.preventDefault();
    setState({ status: "sending", msg: "" });
    const body = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json().catch(() => ({}));
      if (res.status === 503 && whatsapp) {
        toWhatsApp(whatsapp, body);
        setState({ status: "sent", msg: "Opening WhatsApp with your details. Just press send." });
        return;
      }
      if (!res.ok) throw new Error(json.error || "That didn't send. Please try again.");
      setState({ status: "sent", msg: "Thank you. We'll be in touch soon." });
      e.target.reset();
    } catch (err) {
      setState({ status: "error", msg: err.message });
    }
  }

  return (
    <form className="k-form" onSubmit={submit} noValidate={false}>
      {FIELDS.map((f) => (
        <label key={f.name} className="k-field">
          <span>
            {f.label}
            {f.required && <em aria-hidden="true"> *</em>}
          </span>
          <input name={f.name} type={f.type || "text"} required={f.required} autoComplete={f.autoComplete} inputMode={f.inputMode} min={f.type === "number" ? 1 : undefined} />
        </label>
      ))}
      <label className="k-field k-field--wide">
        <span>Message</span>
        <textarea name="message" rows={4} placeholder="What do you sell, and roughly how many garments?" />
      </label>
      {/* honeypot — hidden from people, visible to bots */}
      <input name="website" tabIndex={-1} autoComplete="off" className="k-hp" aria-hidden="true" />
      <div className="k-field--wide k-form__foot">
        <button type="submit" className="k-btn k-btn--gold" disabled={state.status === "sending"}>
          {state.status === "sending" ? "Sending…" : "Book a demo"} <span className="k-arrow" aria-hidden="true">→</span>
        </button>
        <p role="status" aria-live="polite" className={state.status === "error" ? "k-form__err" : "k-muted"}>
          {state.msg}
        </p>
      </div>
    </form>
  );
}
