export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="/" className="text-2xl font-black tracking-tight text-cyan-400">
          SeenJeem
        </a>

        <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
          <a href="/" className="transition hover:text-white">
            الرئيسية
          </a>
          <a href="/pricing" className="transition hover:text-white">
            الباقات
          </a>
          <a href="/dashboard" className="transition hover:text-white">
            حسابي
          </a>
          <a href="/admin" className="transition hover:text-white">
            الإدارة
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="/login"
            className="rounded-2xl border border-white/15 px-4 py-2 text-sm font-semibold transition hover:bg-white/5"
          >
            تسجيل الدخول
          </a>
          <a
            href="/game/start"
            className="rounded-2xl bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 transition hover:opacity-90"
          >
            ابدأ الآن
          </a>
        </div>
      </div>
    </header>
  );
}