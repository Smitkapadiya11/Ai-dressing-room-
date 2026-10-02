import { Monogram } from "@/components/Brand";
import AccessForm from "./AccessForm";

export const metadata = {
  title: "Private preview — Kapadiya & Sons",
  robots: { index: false, follow: false },
};

export default async function AccessPage({ searchParams }) {
  const { next } = await searchParams;
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-void px-6 text-center">
      <Monogram className="h-10 w-auto" />
      <h1 className="font-display text-3xl text-bone">The AI Dressing Room</h1>
      <p className="max-w-sm font-body text-sm text-muted">
        The try-on is in private preview. Enter the access password you were given to step in.
      </p>
      <AccessForm next={next} />
      <a href="/" className="font-body text-xs uppercase tracking-[0.3em] text-muted underline-offset-4 hover:underline">
        Back to the site
      </a>
    </main>
  );
}
