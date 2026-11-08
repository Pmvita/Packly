import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="radar-atmosphere flex min-h-screen flex-col items-center justify-center gap-4 text-[var(--fog)]">
      <p className="font-display text-6xl font-extrabold text-[var(--phosphor)]">
        404
      </p>
      <p className="text-[var(--fog)]/70">This page could not be found.</p>
      <div className="flex gap-3">
        <Link href="/" className="btn-phosphor">
          Home
        </Link>
        <Link href="/dashboard" className="btn-ghost">
          Dashboard
        </Link>
      </div>
    </main>
  );
}
