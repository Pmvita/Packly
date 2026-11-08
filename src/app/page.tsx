import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';

export default function Home() {
  return (
    <main className="radar-atmosphere hero-bleed text-[var(--fog)]">
      <SiteHeader current="home" />

      <section className="relative flex flex-1 flex-col justify-center px-6 py-20">
        <div className="mx-auto w-full max-w-5xl">
          <p className="font-display text-5xl font-extrabold tracking-tight text-[var(--phosphor)] sm:text-7xl md:text-8xl">
            Packly
          </p>
          <h1 className="mt-6 max-w-2xl font-display text-2xl font-semibold tracking-tight text-[#e8fff7] sm:text-3xl">
            Live packet capture for ops that need the wire, not the guesswork.
          </h1>
          <p className="mt-4 max-w-xl text-base text-[var(--fog)]/85">
            Stream, decode, and diagnose traffic from one dense dashboard —
            mock, PCAP, or real NIC.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/dashboard" className="btn-phosphor">
              Open dashboard
            </Link>
            <Link href="/history" className="btn-ghost">
              View history
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--line)] px-6 py-8">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 text-sm text-[var(--fog)]/70">
          <span className="font-data text-xs tracking-wide">
            © {new Date().getFullYear()} Packly
          </span>
          <nav className="flex gap-6">
            <Link href="/privacy" className="link-phosphor">
              Privacy
            </Link>
            <Link href="/terms" className="link-phosphor">
              Terms
            </Link>
            <Link href="/dashboard" className="link-phosphor">
              Dashboard
            </Link>
            <a
              href="https://github.com/Pmvita/Packly"
              className="link-phosphor"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
          </nav>
        </div>
      </footer>
    </main>
  );
}
