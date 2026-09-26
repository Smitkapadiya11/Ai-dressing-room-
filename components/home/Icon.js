// Line icons (Lucide geometry, 24-grid, 1.5 stroke). Decorative only —
// every use sits next to a text label, so they are aria-hidden.
const PATHS = {
  hanger: "M12 7a2 2 0 1 1 2-2M12 7v1.5L3 15a1.5 1.5 0 0 0 1 2.7h16a1.5 1.5 0 0 0 1-2.7l-9-6.5",
  spark: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z",
  qr: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2M14 18h2v2M18 18h2v2",
  mirror: "M12 2c3.9 0 7 3.1 7 7v13H5V9c0-3.9 3.1-7 7-7zM9 22v-4M15 22v-4",
  play: "M6 4l14 8-14 8z",
  eye: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2",
  heart: "M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 12 5.3 5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z",
  crown: "M3 18h18M4 16L2 6l6 4 4-6 4 6 6-4-2 10z",
  wallet: "M3 7a2 2 0 0 1 2-2h13v4M3 7v11a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2zM16 14h.01",
  phone: "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z",
  arrows: "M8 7l-5 5 5 5M16 7l5 5-5 5",
  plus: "M12 5v14M5 12h14",
  check: "M20 6L9 17l-5-5",
};

export default function Icon({ name, size = 22, className = "" }) {
  return (
    <svg className={`k-icon ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={PATHS[name]} />
    </svg>
  );
}
