import { redirect } from "next/navigation";
import "@/styles/tokens.css";
import "@/styles/home.css";
import "@/styles/dressing-room.css";
import { SITE_URL } from "@/lib/site";
import { MEDIA } from "@/lib/media";
import { contact } from "@/content/home";
import Motion from "@/components/home/Motion";
import { Nav, Hero, StudioSection, Rack, Problem, Origin, Founder } from "@/components/home/Top";
import { Steps, Features, Honesty, System, Reasons, Plans, Faq, Closing } from "@/components/home/Bottom";
import { Chapter } from "@/components/home/ui";
import { chapters } from "@/content/home";

export const metadata = {
  title: "The AI Dressing Room by Smit Kapadiya — Kapadiya & Sons",
  description:
    "An AI dressing room for clothing shops and showrooms. Customers see your sarees, lehengas and sherwanis on their own body in seconds. Built by Smit Kapadiya, Kapadiya & Sons, Surat.",
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: "Kapadiya & Sons", locale: "en_IN", url: "/" },
  twitter: { card: "summary_large_image" },
};

const JSON_LD = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Kapadiya & Sons",
    url: SITE_URL,
    founder: { "@type": "Person", name: "Smit Kapadiya" },
    email: contact.email,
    telephone: contact.phoneDisplay,
    contactPoint: { "@type": "ContactPoint", contactType: "sales", telephone: contact.phoneDisplay, email: contact.email, areaServed: "IN" },
    address: { "@type": "PostalAddress", addressLocality: "Surat", addressRegion: "Gujarat", addressCountry: "IN" },
  },
  {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Kapadiya & Sons Try-On Mirror",
    description: "A smart mirror and software that lets clothing-shop customers see catalogue garments on their own body.",
    brand: { "@type": "Brand", name: "Kapadiya & Sons" },
    category: "Retail virtual try-on system",
  },
];

// A physical mirror pinned to the root URL sets KIOSK_MODE=1 and never sees the marketing page.
export default function Home() {
  if (process.env.KIOSK_MODE === "1") redirect("/mirror");
  return (
    <div className={`k-page ${MEDIA.grain ? "k-page--grain" : ""}`} style={MEDIA.grain ? { "--grain": `url(${MEDIA.grain})` } : undefined}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
      <Motion />
      <div className="dr-progress" aria-hidden="true" />
      <Nav />
      <main>
        <Hero />
        <StudioSection />
        <Rack />
        <Problem />
        <Chapter {...chapters[0]} />
        <Origin />
        <Founder />
        <Steps />
        <Features />
        <Honesty />
        <Chapter {...chapters[1]} />
        <System />
        <Reasons />
        <Chapter {...chapters[2]} />
        <Plans />
        <Faq />
        <Closing />
      </main>
    </div>
  );
}
