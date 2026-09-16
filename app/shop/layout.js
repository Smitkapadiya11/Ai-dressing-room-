import Link from "next/link";
import { Monogram } from "@/components/Brand";
import { SHOP } from "@/lib/garments";

const TABS = [
  { href: "/shop", label: "Today" },
  { href: "/shop/collection", label: "Collection" },
  { href: "/shop/month", label: "Your month" },
];

export default function ShopLayout({ children }) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="sticky top-0 z-40 border-b border-line-light bg-paper/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-space-lg">
          <div className="flex items-center gap-space-lg">
            <div className="rounded-md bg-void px-3 py-2">
              <Monogram className="h-7 w-auto" />
            </div>
            <nav className="flex gap-space-md">
              {TABS.map((t) => (
                <Link
                  key={t.href}
                  href={t.href}
                  className="font-body text-[14px] text-ink-soft transition-colors duration-200 hover:text-ink"
                >
                  {t.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-space-sm">
            <div className="text-right">
              <p className="font-body text-[14px] font-medium text-ink">{SHOP.name}</p>
              <p className="font-body text-[12px] text-ink-soft">{SHOP.branch}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-light/15 font-body text-[13px] font-semibold text-accent-light">
              K
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1440px] px-space-lg py-space-xl">{children}</main>
      <footer className="border-t border-line-light py-space-lg">
        <p className="text-center font-body text-[12px] text-ink-soft">
          Kapadiya &amp; Sons · the mirror, from the counter
        </p>
      </footer>
    </div>
  );
}
