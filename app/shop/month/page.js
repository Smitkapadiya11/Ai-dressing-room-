import { ranked, today } from "@/lib/analytics";
import { inr } from "@/lib/garments";
import { SHOP } from "@/lib/garments";

export const dynamic = "force-dynamic";

export default function MonthPage() {
  const t = today();
  const list = ranked();

  const figures = [
    [t.monthCount, "looks tried on the mirror", "Each one is a customer who stayed in the shop longer than she meant to."],
    ["68%", "of them tried a second garment", "The mirror's real job — the second look is where the sale usually is."],
    [t.topGarment, "the month's most-tried piece", "Keep it on the rail and in the window."],
    ["₹" + (t.monthCount * 5).toLocaleString("en-IN"), "what the month cost to run", "About ₹5 a look, all in."],
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-[40px] leading-tight text-ink">
            September at {SHOP.name}
          </h1>
          <p className="mt-2 font-body text-[15px] text-ink-soft">{SHOP.branch}</p>
        </div>
        <button className="rounded-full bg-accent-light px-5 py-2.5 font-body text-[13px] font-semibold text-white">
          Send to WhatsApp
        </button>
      </div>

      <div className="mt-space-xl flex flex-col gap-space-lg">
        {figures.map(([v, l, note], i) => (
          <div key={l} className="fade-up border-b border-line-light pb-space-lg" style={{ animationDelay: `${i * 70}ms` }}>
            <p className="font-display text-[36px] leading-none text-ink">{v}</p>
            <p className="mt-space-sm font-body text-[15px] text-ink">{l}</p>
            <p className="mt-1 font-body text-[13px] text-ink-soft">{note}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-space-xl font-display text-[28px] text-ink">Most tried</h2>
      <ol className="mt-space-md flex flex-col gap-space-sm">
        {list.map((g, i) => (
          <li key={g.id} className="flex items-center gap-space-md border-b border-line-light py-space-sm">
            <span className="w-6 font-body text-[13px] text-ink-soft">{i + 1}</span>
            <img src={g.image} alt="" className="h-16 w-12 rounded-md object-cover" />
            <div className="flex-1">
              <p className="font-body text-[15px] text-ink">{g.name}</p>
              <p className="font-body text-[13px] text-ink-soft">{inr(g.price)}</p>
            </div>
            <div className="text-right">
              <p className="font-display text-[22px] leading-none text-ink">{g.tried}</p>
              <p className="font-body text-[11px] text-ink-soft">tried · {g.sold} sold</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-space-xl rounded-card bg-white p-space-lg shadow-soft">
        <p className="font-body text-[15px] leading-relaxed text-ink">
          The mirror was busiest between six and eight in the evening, and almost
          twice as busy on Saturday and Sunday. The crimson lehenga was tried far
          more than it sold — worth asking the next few customers what stopped
          them. Four in ten customers who tried something scanned the QR to keep
          the photo, which means your pieces are travelling home on phones even
          when they do not leave the shop.
        </p>
      </div>
    </div>
  );
}
