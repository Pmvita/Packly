import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 text-slate-100">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="text-slate-400">This page could not be found.</p>
      <div className="flex gap-4">
        <Link href="/" className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-emerald-950">Home</Link>
        <Link href="/dashboard" className="rounded-full border border-slate-600 px-5 py-2 text-sm font-semibold text-slate-200">Dashboard</Link>
      </div>
    </main>
  );
}
