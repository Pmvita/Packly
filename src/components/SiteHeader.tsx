import Link from 'next/link';

interface SiteHeaderProps {
  current?: 'home' | 'dashboard' | 'history';
}

export function SiteHeader({ current }: SiteHeaderProps) {
  return (
    <header className="border-b border-[var(--line)] px-6 py-4">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link
          href="/"
          className="font-display text-sm font-semibold tracking-wide text-[var(--phosphor)]"
        >
          Packly
        </Link>
        <nav className="flex gap-6 text-sm">
          <Link
            href="/"
            className="link-phosphor"
            aria-current={current === 'home' ? 'page' : undefined}
          >
            Home
          </Link>
          <Link
            href="/dashboard"
            className="link-phosphor"
            aria-current={current === 'dashboard' ? 'page' : undefined}
          >
            Dashboard
          </Link>
          <Link
            href="/history"
            className="link-phosphor"
            aria-current={current === 'history' ? 'page' : undefined}
          >
            History
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
    </header>
  );
}
