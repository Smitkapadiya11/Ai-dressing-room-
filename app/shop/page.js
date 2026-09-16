import { daily, today, triedNotSold } from "@/lib/analytics";
import { inr } from "@/lib/garments";

export const dynamic = "force-dynamic";

function Stat({ value, label, i }) {
  return (
    <div
      className="fade-up rounded-card border border-line-light bg-white p-space-lg shadow-soft"
      style={{ animationDelay: `${i * 60}ms` }}
    >
      <p className="font-display leading-[1.05] text-ink" style={{ fontSize: typeof value === "string" && value.length > 12 ? "26px" : "44px" }}>{value}</p>
      <p className="mt-space-sm font-body text-[13px] text-ink-soft">{label}</p>
    </div>
  );
}

function Chart({ data }) {
  const max = Math.max(...data.map((d) => d.tryOns));
  const W = 900, H = 220, P = 8;
  const pts = data.map((d, i) => [
    P + (i / (data.length - 1)) * (W - P * 2),
    H - P - (d.tryOns / max) * (H - P * 2),
  ]);
  const path = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${path} L${W - P},${H - P} L${P},${H - P} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Try-ons per day, last 30 days">
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1={P} x2={W - P} y1={P + f * (H - P * 2)} y2={P + f * (H - P * 2)} stroke="#E8E4DC" strokeWidth="1" />
      ))}
      <path d={area} fill="#A8853F" opacity="0.07" />
      <path d={path} fill="none" stroke="#A8853F" strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={pts.at(-1)[0]} cy={pts.at(-1)[1]} r="3.5" fill="#A8853F" />
    </svg>
  );
}

export default function TodayPage() {
  const t = today();
  const d = daily();
  const gap = triedNotSold();

  return (
    <div>
      <h1 className="font-display text-[40px] leading-tight text-ink">Today</h1>
      <p className="mt-2 font-body text-[15px] text-ink-soft">
        What the mirror saw. Updated as it happens.
      </p>

      <div className="mt-space-lg grid grid-cols-1 gap-space-md sm:grid-cols-2 lg:grid-cols-4">
        <Stat i={0} value={t.todayCount} label="try-ons today" />
        <Stat i={1} value={t.monthCount} label="this month" />
        <Stat i={2} value={t.topGarment} label="most tried today" />
        <Stat i={3} value={t.busiestHour} label="busiest hour" />
      </div>

      <div className="mt-space-lg grid grid-cols-1 gap-space-md lg:grid-cols-3">
        <div className="fade-up rounded-card border border-line-light bg-white p-space-lg shadow-soft lg:col-span-2" style={{ animationDelay: "240ms" }}>
          <p className="font-body text-[13px] font-medium uppercase tracking-[0.18em] text-ink-soft">
            Last 30 days
          </p>
          <div className="mt-space-md"><Chart data={d} /></div>
        </div>

        <div className="fade-up rounded-card border border-line-light bg-white p-space-lg shadow-soft" style={{ animationDelay: "300ms" }}>
          <p className="font-body text-[13px] font-medium uppercase tracking-[0.18em] text-ink-soft">
            Tried but not sold
          </p>
          <p className="mt-2 font-body text-[13px] text-ink-soft">
            The gap worth a phone call.
          </p>
          <ul className="mt-space-md flex flex-col gap-space-md">
            {gap.map((g) => (
              <li key={g.id} className="flex items-center gap-space-sm">
                <img src={g.image} alt="" className="h-14 w-11 rounded-md object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-body text-[14px] text-ink">{g.name}</p>
                  <p className="font-body text-[12px] text-ink-soft">{inr(g.price)}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-[22px] leading-none text-ink">{g.gap}</p>
                  <p className="font-body text-[11px] text-ink-soft">walked</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
