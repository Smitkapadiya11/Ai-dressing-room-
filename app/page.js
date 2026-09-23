import fs from "node:fs";
import path from "node:path";
import { redirect } from "next/navigation";
import "@/styles/tokens.css";
import "@/styles/home.css";
import Motion from "@/components/home/Motion";
import { Nav, Hero, Problem, Origin, Founder } from "@/components/home/Top";
import { Steps, Features, Honesty, System, Reasons, Plans, Faq, Closing } from "@/components/home/Bottom";

export const metadata = {
  title: "Kapadiya & Sons — A try-on mirror for Indian clothing shops",
  description:
    "A smart mirror and software for clothing retailers and showrooms. Customers see your sarees, lehengas and kurtas on their own body in seconds. Made in Surat.",
};

// A physical mirror pinned to the root URL sets KIOSK_MODE=1 and never sees the marketing page.
export default function Home() {
  if (process.env.KIOSK_MODE === "1") redirect("/mirror");
  const hasPortrait = fs.existsSync(path.join(process.cwd(), "public/media/founder.jpg"));
  return (
    <div className="k-page">
      <Motion />
      <Nav />
      <main>
        <Hero />
        <Problem />
        <Origin />
        <Founder hasPortrait={hasPortrait} />
        <Steps />
        <Features />
        <Honesty />
        <System />
        <Reasons />
        <Plans />
        <Faq />
        <Closing />
      </main>
    </div>
  );
}
