export default function Loading() {
  return (
    <div className="radar-atmosphere min-h-screen">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="h-8 w-48 animate-pulse bg-[var(--surface)]" />
        <div className="mt-6 h-64 animate-pulse bg-[var(--panel)]" />
      </div>
    </div>
  );
}
