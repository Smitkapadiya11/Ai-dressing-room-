import { get } from "@/lib/store";
import { Monogram } from "@/components/Brand";

export const dynamic = "force-dynamic";

export default async function LookPage({ params }) {
  const { id } = await params;
  const entry = get(id);

  return (
    <main className="flex min-h-screen flex-col items-center bg-void px-gutter py-space-xl">
      <Monogram className="h-10 w-auto" />
      {entry ? (
        <>
          <img
            src={entry.image}
            alt={entry.meta?.garmentName || "Your look"}
            className="rise mt-space-lg w-full max-w-md rounded-card border border-border-subtle object-cover shadow-lift"
          />
          <div className="fade-up mt-space-lg text-center" style={{ animationDelay: "200ms" }}>
            <p className="font-display text-headline-lg text-bone">
              {entry.meta?.garmentName || "Your look"}
            </p>
            {entry.meta?.price && (
              <p className="eyebrow mt-2 text-muted">{entry.meta.price}</p>
            )}
          </div>
          <a
            href={entry.image}
            download="kapadiya-look.png"
            className="btn-primary fade-up mt-space-lg"
            style={{ animationDelay: "320ms" }}
          >
            Save this look
          </a>
        </>
      ) : (
        <div className="mt-space-xl text-center">
          <p className="font-display text-headline-lg text-bone">This look has expired.</p>
          <p className="mt-space-sm font-body text-body-sm text-muted">
            Looks are held for fifteen minutes, then removed. Nothing about you is stored.
          </p>
        </div>
      )}
      <p className="eyebrow mt-auto pt-space-xl text-muted">Kapadiya &amp; Sons · Surat</p>
    </main>
  );
}
