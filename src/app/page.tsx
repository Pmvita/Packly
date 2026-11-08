import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Packly
          </Link>
          <nav className="flex gap-6 text-sm text-slate-300">
            <Link href="/dashboard" className="transition hover:text-emerald-300">Dashboard</Link>
            <Link href="/history" className="transition hover:text-emerald-300">History</Link>
            <a href="https://github.com/Pmvita/Packly" className="transition hover:text-emerald-300" target="_blank" rel="noreferrer">GitHub</a>
          </nav>
        </div>
      </header>

      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-300">Network observability</p>
          <h1 className="mt-4 text-5xl font-bold tracking-tight sm:text-6xl">
            Deep visibility into your network traffic.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-400">
            Capture, decode, and visualise packets from a single Next.js dashboard. Mock capture works out of the box; upload a PCAP/PCAPNG to replay real traffic without installing libpcap.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/dashboard" className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400">
              Open dashboard
            </Link>
            <Link href="/history" className="rounded-full border border-slate-600 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300">
              View history
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-800 px-6 py-16">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          {[
            { title: 'Live capture', body: 'Socket.IO stream with mock fallback and real NIC support via libpcap/Npcap.' },
            { title: 'PCAP / PCAPNG', body: 'Upload or play sample captures; decode Ethernet frames without capture privileges.' },
            { title: 'Diagnostic report', body: 'Protocol counts, port-spread, RST bursts, SYN volume exported as markdown.' },
          ].map((f) => (
            <div key={f.title} className="rounded-lg border border-slate-800 bg-slate-900/60 p-6">
              <h3 className="text-base font-semibold text-slate-100">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-auto border-t border-slate-800 px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 text-sm text-slate-400">
          <span>© {new Date().getFullYear()} Packly</span>
          <nav className="flex gap-6">
            <Link href="/privacy" className="hover:text-emerald-300">Privacy</Link>
            <Link href="/terms" className="hover:text-emerald-300">Terms</Link>
            <Link href="/dashboard" className="hover:text-emerald-300">Dashboard</Link>
            <Link href="/history" className="hover:text-emerald-300">History</Link>
            <a href="https://github.com/Pmvita/Packly" className="hover:text-emerald-300" target="_blank" rel="noreferrer">GitHub</a>
          </nav>
        </div>
      </footer>
    </main>
  );
}
