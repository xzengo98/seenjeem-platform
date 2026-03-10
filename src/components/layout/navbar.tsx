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
  }, [pathname]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.refresh();
    router.push("/");
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
          {authState.isLoggedIn ? <Link href="/account">حسابي</Link> : null}
          {authState.isAdmin ? <Link href="/admin">الإدارة</Link> : null}
        </nav>

        <div className="flex items-center gap-3">
          {authState.loading ? (
            <div className="rounded-2xl border border-white/10 px-5 py-2 text-sm text-slate-400">
              جارٍ التحميل...
            </div>
          ) : authState.isLoggedIn ? (
            <>
              <div className="hidden rounded-2xl border border-white/10 px-4 py-2 text-sm text-slate-300 lg:block">
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
      </div>
    </header>
  );
}