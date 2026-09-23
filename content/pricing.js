// Plans. Hide the whole section with NEXT_PUBLIC_SHOW_PRICING=0.
// Feature bullets are empty on purpose — fill them in once the limits are decided.

export const SHOW_PRICING = process.env.NEXT_PUBLIC_SHOW_PRICING !== "0";

export const pricing = {
  eyebrow: "Plans",
  title: "Monthly, like rent for the counter.",
  note: "{{TBD: GST inclusive or exclusive}} Hardware on rent is quoted separately.",
  tiers: [
    { name: "Lite", price: "₹4,999", period: "/month", lead: "Up to 400 try-ons a month.", features: [] },
    { name: "Standard", price: "₹12,999", period: "/month", lead: "", features: [], featured: true },
    { name: "Brand", price: "₹24,999", period: "/month", lead: "", features: [] },
  ],
  cta: { label: "Talk to us", href: "#contact" },
};
