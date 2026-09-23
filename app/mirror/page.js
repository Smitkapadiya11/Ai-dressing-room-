import Kiosk from "@/components/Kiosk";

export const dynamic = "force-dynamic";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#08090B",
};

export const metadata = { title: "The Mirror — Kapadiya & Sons" };

// No marketing chrome here — a physical mirror boots straight into this.
export default function MirrorPage() {
  return (
    <div className="select-none">
      <Kiosk />
    </div>
  );
}
