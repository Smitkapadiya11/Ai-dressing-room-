import { getLook } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function LookPage({ params }) {
  const { id } = await params;
  const image = getLook(id);

  if (!image) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-[1rem] bg-void px-8 text-center">
        <p className="font-display text-2xl text-bone">This look has expired.</p>
        <p className="font-body text-body-sm text-muted">Looks last fifteen minutes. Ask to try it on again in store.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-void p-4">
      <img src={image} alt="Your look at Kapadiya & Sons" className="max-h-[90dvh] w-auto rounded-lg" />
    </div>
  );
}
