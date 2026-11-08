export const metadata = { title: 'Terms of Service — Packly', description: 'Terms governing use of Packly.' };

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-slate-100">
      <h1 className="text-3xl font-bold">Terms & Conditions</h1>
      <p className="mt-4 text-slate-400">
        Packly is provided as-is for network analysis. You are responsible for ensuring you have authorization to capture traffic on any network. Live capture requires host privileges; do not use on networks you do not own or have permission to monitor.
      </p>
    </main>
  );
}
