import Link from "next/link";

export default function StoreCancelPage() {
  return (
    <main className="flex min-h-screen w-full justify-center pb-24 md:pb-32" style={{ paddingTop: "clamp(12rem, 18vh, 20rem)" }}>
      <div className="w-full max-w-3xl px-4">
        <div className="rounded-3xl border border-white/15 bg-gradient-to-br from-red-900/40 via-black/35 to-red-950/65 px-8 py-10 text-white shadow-2xl backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200/80">ASU Store</p>
          <h1 className="mt-2 text-3xl font-extrabold text-amber-100">Checkout canceled</h1>
          <p className="mt-3 text-white/82">
            No order was submitted. You can return to the store and continue when you are ready.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/store"
              className="inline-flex items-center rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-300"
            >
              Return to Store
            </Link>
            <Link
              href="/"
              className="inline-flex items-center rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
