import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function Navbar() {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    isAdmin = profile?.role === "admin";
  }

  return (
    <header className="border-b border-white/10 bg-slate-950/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 text-white">
        <Link href="/" className="text-3xl font-black text-cyan-400">
          SeenJeem
        </Link>

        <nav className="flex items-center gap-6 text-sm font-semibold text-slate-300">
          <Link href="/">الرئيسية</Link>
          <Link href="/pricing">الباقات</Link>
          <Link href="/game/start">اللعب</Link>

          {isAdmin ? <Link href="/admin">الإدارة</Link> : null}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
  href="/game/start"
  prefetch={false}
  className="rounded-2xl bg-cyan-400 px-5 py-2 font-bold text-slate-950"
>
  ابدأ الآن
</Link>

              <Link
                href="/logout"
                className="rounded-2xl border border-white/10 px-5 py-2 font-semibold text-slate-200 transition hover:bg-white/5"
              >
                تسجيل الخروج
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/register"
                className="rounded-2xl bg-cyan-400 px-5 py-2 font-bold text-slate-950"
              >
                إنشاء حساب
              </Link>

              <Link
                href="/login"
                className="rounded-2xl border border-white/10 px-5 py-2 font-semibold text-slate-200 transition hover:bg-white/5"
              >
                تسجيل الدخول
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}