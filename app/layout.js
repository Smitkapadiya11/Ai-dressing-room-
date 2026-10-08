// Fonts are self-hosted, not pulled from Google at runtime.
// A kiosk in a shop with unreliable wifi must never render in Times New Roman.
import "@fontsource/playfair-display/400.css";
import "@fontsource/playfair-display/500.css";
import "@fontsource/playfair-display/600.css";
import "@fontsource/manrope/300.css";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "./globals.css";
import { SITE_URL } from "@/lib/site";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Kapadiya & Sons — AI Creative Studio & Try-On",
  description:
    "AI fashion content, AI ads, short brand films and website try-on by Smit Kapadiya in Surat.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#08090B",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-void font-body text-body-lg text-on-surface antialiased">
        {children}
      </body>
    </html>
  );
}
