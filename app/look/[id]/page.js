import { readLook } from "@/lib/store";
import { Monogram } from "@/components/Brand";

export const dynamic = "force-dynamic";

export default async function LookPage({ params }) {
  const { id } = await params;
  const url = readLook(id);

  if (!url) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-void px-8 text-center">
        <p className="font-display text-2xl text-bone">This look has expired.</p>
        <p className="font-body text-sm text-muted">
          Looks last fifteen minutes. Ask to try it on again in store.
        </p>
      </main>
    );
  }

  return (
    <main className="look-page flex min-h-dvh flex-col items-center gap-6 bg-void px-4 py-8">
      <Monogram className="h-9 w-auto" />
      <p className="look-cheer">You look wonderful.</p>
      {/* Straight from the blob CDN — never re-encoded through us, which
          is what keeps this fast on shop wifi. */}
      <img
        src={url}
        alt="Your look at Kapadiya &amp; Sons"
        className="look-img w-auto max-w-full rounded-lg"
        style={{ maxHeight: "76dvh" }}
      />
      <a href={url} download="kapadiya-look.jpg" className="btn-primary">
        Save this look
      </a>
      <p className="mt-auto font-body text-xs uppercase tracking-[0.3em] text-muted">
        The AI Dressing Room · Kapadiya &amp; Sons, Surat
      </p>
    </main>
  );
}
