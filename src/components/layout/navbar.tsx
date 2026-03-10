"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Profile = {
  role: string;
  games_remaining: number;
  username: string | null;
};

type AuthState = {
  loading: boolean;
  isLoggedIn: boolean;
  isAdmin: boolean;
  gamesRemaining: number;
  username: string | null;
};

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [menuOpen, setMenuOpen] = useState(false);
  const [authState, setAuthState] = useState<AuthState>({
    loading: true,
    isLoggedIn: false,
    isAdmin: false,
    gamesRemaining: 0,
    username: null,
  });

  async function loadUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setAuthState({
        loading: false,
        isLoggedIn: false,
        isAdmin: false,
        gamesRemaining: 0,
        username: null,
      });
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, games_remaining, username")
      .eq("id", user.id)
      .single();

    const typedProfile = profile as Profile | null;

    setAuthState({
      loading: false,
      isLoggedIn: true,
      isAdmin: typedProfile?.role === "admin",
      gamesRemaining: typedProfile?.games_remaining ?? 0,
      username: typedProfile?.username ?? null,
    });
  }

  useEffect(() => {
    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadUser();
      router.refresh();
    });

    const onFocus = () => loadUser();
    window.addEventListener("focus", onFocus);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("focus", onFocus);
    };
  }, [router, supabase]);

  useEffect(() => {
    loadUser();
    setMenuOpen(false);
  }, [pathname]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.refresh();
    router.push("/");
  }

  const NavLinks = () => (
    <>
      <Link href="/" className="transition hover:text-white">
        الرئيسية
      </Link>
      <Link href="/pricing" className="transition hover:text-white">
        الباقات
      </Link>
      <Link href="/game/start" className="transition hover:text-white">
        اللعب
      </Link>
      {authState.isLoggedIn ? (
        <Link href="/account" className="transition hover:text-white">
          حسابي
        </Link>
      ) : null}
      {authState.isAdmin ? (
        <Link href="/admin" className="transition hover:text-white">
          الإدارة
        </Link>
      ) : null}
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="text-2xl font-black text-cyan-400 md:text-3xl">
            SeenJeem
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-300 lg:flex">
            <NavLinks />
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            {authState.loading ? (
              <div className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-slate-400">
                جارٍ التحميل...
              </div>
            ) : authState.isLoggedIn ? (
              <>
                <div className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-slate-300">
                  {authState.username || "مستخدم"} • الألعاب: {authState.gamesRemaining}
                </div>

                <Link
                  href="/game/start"
                  className="rounded-2xl bg-cyan-400 px-5 py-2 font-bold text-slate-950"
                >
                  ابدأ الآن
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-2xl border border-white/10 px-5 py-2 font-semibold text-slate-200 transition hover:bg-white/5"
                >
                  تسجيل الخروج
                </button>
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

          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 text-slate-200 lg:hidden"
            aria-label="فتح القائمة"
          >
            <span className="text-xl">☰</span>
          </button>
        </div>

        {menuOpen ? (
          <div className="mt-3 rounded-[1.5rem] border border-white/10 bg-white/5 p-4 lg:hidden">
            <div className="flex flex-col gap-4 text-sm font-semibold text-slate-300">
              <NavLinks />

              <div className="border-t border-white/10 pt-4">
                {authState.loading ? (
                  <div className="rounded-2xl border border-white/10 px-4 py-3 text-center text-slate-400">
                    جارٍ التحميل...
                  </div>
                ) : authState.isLoggedIn ? (
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-300">
                      {authState.username || "مستخدم"} • الألعاب: {authState.gamesRemaining}
                    </div>

                    <Link
                      href="/game/start"
                      className="block rounded-2xl bg-cyan-400 px-4 py-3 text-center font-bold text-slate-950"
                    >
                      ابدأ الآن
                    </Link>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full rounded-2xl border border-white/10 px-4 py-3 font-semibold text-slate-200"
                    >
                      تسجيل الخروج
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Link
                      href="/register"
                      className="block rounded-2xl bg-cyan-400 px-4 py-3 text-center font-bold text-slate-950"
                    >
                      إنشاء حساب
                    </Link>

                    <Link
                      href="/login"
                      className="block rounded-2xl border border-white/10 px-4 py-3 text-center font-semibold text-slate-200"
                    >
                      تسجيل الدخول
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}