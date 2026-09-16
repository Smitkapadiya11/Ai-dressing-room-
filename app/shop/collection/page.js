import { GARMENTS, inr } from "@/lib/garments";

export const dynamic = "force-dynamic";

export default function CollectionPage() {
  return (
    <div>
      <h1 className="font-display text-[40px] leading-tight text-ink">Collection</h1>
      <p className="mt-2 font-body text-[15px] text-ink-soft">
        What the mirror can show. Add a photo, set a price, switch it on.
      </p>

      <div className="mt-space-lg flex items-center justify-center rounded-card border-2 border-dashed border-line-light bg-white/60 py-space-xl">
        <div className="text-center">
          <p className="font-body text-[15px] text-ink">Drop garment photos here</p>
          <p className="mt-1 font-body text-[13px] text-ink-soft">
            Plain background, full length, JPEG or PNG
          </p>
        </div>
      </div>

      <div className="mt-space-lg grid grid-cols-1 gap-space-md sm:grid-cols-2 lg:grid-cols-4">
        {GARMENTS.map((g, i) => (
          <article
            key={g.id}
            className="fade-up overflow-hidden rounded-card border border-line-light bg-white shadow-soft"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <img src={g.image} alt={g.name} className="aspect-[3/4] w-full object-cover" />
            <div className="p-space-md">
              <p className="font-body text-[15px] text-ink">{g.name}</p>
              <p className="mt-1 font-body text-[13px] text-ink-soft">{inr(g.price)}</p>
              <div className="mt-space-sm flex flex-wrap gap-1.5">
                {g.sizes.map((s) => (
                  <span key={s} className="rounded-full border border-line-light px-2.5 py-0.5 font-body text-[11px] text-ink-soft">
                    {s}
                  </span>
                ))}
              </div>
              <div className="mt-space-md flex items-center justify-between border-t border-line-light pt-space-sm">
                <span className="font-body text-[12px] text-ink-soft">On the mirror</span>
                <span className="relative inline-flex h-5 w-9 items-center rounded-full bg-accent-light">
                  <span className="ml-auto mr-0.5 h-4 w-4 rounded-full bg-white" />
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
