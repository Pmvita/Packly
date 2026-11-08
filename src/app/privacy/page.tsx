export const metadata = { title: 'Privacy Policy — Packly', description: 'How Packly handles captured packet data.' };

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-slate-100">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="mt-4 text-slate-400">
        Packly processes packet data on the host running the capture engine. No data is sold or shared with third parties. Captured payloads may be retained according to your configured TTL (default 30 days); raw payloads are cleared after 24 hours. You control your database and retention.
      </p>
      <p className="mt-4 text-slate-400">Contact: Petermvita@hotmail.com</p>
    </main>
  );
}
