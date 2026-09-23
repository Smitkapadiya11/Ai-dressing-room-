import { ImageResponse } from "next/og";

export const alt = "Kapadiya & Sons — a try-on mirror for Indian clothing shops";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Designed card, not a default: black, one gold thread, serif headline.
export default function OG() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#0C0B0A", color: "#F1ECE2", padding: "72px 80px", fontFamily: "serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, color: "#C9A961", fontSize: 22, letterSpacing: 6, textTransform: "uppercase", fontFamily: "sans-serif" }}>
          <div style={{ width: 48, height: 2, background: "#C9A961" }} />
          Kapadiya &amp; Sons · Surat
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 76, lineHeight: 1.05 }}>
          <span>Every saree in the shop,</span>
          <span style={{ color: "#E3CFA0", fontStyle: "italic" }}>on your customer.</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontFamily: "sans-serif", fontSize: 24, color: "#A39B8E" }}>
          <span>A try-on mirror for clothing shops and showrooms</span>
          <div style={{ width: 220, height: 2, background: "linear-gradient(90deg, transparent, #C9A961)" }} />
        </div>
      </div>
    ),
    size
  );
}
