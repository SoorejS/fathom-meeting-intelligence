import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#090B0F] text-slate-200 flex items-center justify-center p-6">
      <div className="max-w-md space-y-4 rounded-2xl border border-slate-800 bg-[#131722] p-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Fathom · Link unavailable</p>
        <h1 className="text-2xl font-bold text-white">This meeting or page could not be found</h1>
        <p className="text-sm leading-relaxed text-slate-400">Check that you copied the complete link, or open My Calls to explore the available meetings.</p>
        <Link href="/" className="inline-flex rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-black hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-white">Open My Calls</Link>
      </div>
    </main>
  );
}
