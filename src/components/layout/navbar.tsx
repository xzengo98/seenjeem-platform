"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
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

const LOGO_URL = "https://k.top4top.io/p_3722mj2o21.png";

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

  const loadUser = useCallback(async () => {
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
  }, [supabase]);

  useEffect(() => {
    void loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadUser();
      router.refresh();
    });

    const onFocus = () => {
      void loadUser();
    };

    window.addEventListener("focus", onFocus);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("focus", onFocus);
    };
  }, [loadUser, router, supabase]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.refresh();
    router.push("/");
  }

  function linkClasses(href: string) {
    const isActive = pathname === href;

    return [
      "rounded-2xl px-3 py-2 text-sm font-bold transition",
      isActive
        ? "bg-cyan-400/10 text-cyan-300"
        : "text-slate-200 hover:bg-white/5 hover:text-white",
    ].join(" ");
  }

  function NavLinks() {
    return (
      <>
        <Link href="/" className={linkClasses("/")}>
          الرئيسية
        </Link>
        <Link href="/pricing" className={linkClasses("/pricing")}>
          الباقات
        </Link>
        <Link href="/game/start" className={linkClasses("/game/start")}>
         العبة
        </Link>
        {authState.isLoggedIn ? (
          <Link href="/account" className={linkClasses("/account")}>
            حسابي
          </Link>
        ) : null}
        {authState.isAdmin ? (
          <Link href="/admin" className={linkClasses("/admin")}>
            الإدارة
          </Link>
        ) : null}
      </>
    );
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 lg:gap-4">
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 lg:hidden"
            aria-label="فتح القائمة"
          >
            ☰
          </button>

          <Link
            href="/"
            className="flex items-center gap-3 rounded-2xl transition hover:opacity-95"
          >
            <img
              src={LOGO_URL}
              alt="لمّتنا"
              className="h-14 w-auto object-contain sm:h-16 md:h-[4.5rem] lg:h-[4.75rem]"
              loading="eager"
              decoding="async"
            />
            <span className="hidden text-xl font-black tracking-tight text-white sm:block md:text-2xl">
              لمّتنا
            </span>
          </Link>
        </div>

        <nav className="hidden items-center gap-1 lg:flex">
          <NavLinks />
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {authState.loading ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
              جارٍ التحميل...
            </div>
          ) : authState.isLoggedIn ? (
            <>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
                {authState.username || "مستخدم"} • الألعاب: {authState.gamesRemaining}
              </div>

              <Link
                href="/game/start"
                className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-cyan-400 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-cyan-300"
              >
                ابدأ الآن
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-200 transition hover:bg-red-500/15"
              >
                تسجيل الخروج
              </button>
            </>
          ) : (
            <>
              <Link
                href="/register"
                className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-cyan-400 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-cyan-300"
              >
                إنشاء حساب
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10"
              >
                تسجيل الدخول
              </Link>
            </>
          )}
        </div>
      </div>

      {menuOpen ? (
        <div className="border-t border-white/10 bg-slate-950/95 px-4 py-4 lg:hidden sm:px-6">
          <div className="mb-4 flex items-center justify-center">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-2xl transition hover:opacity-95"
            >
              <img
                src={LOGO_URL}
                alt=""
                className="h-16 w-auto object-contain"
                loading="eager"
                decoding="async"
              />
              <span className="text-xl font-black tracking-tight text-white">
                لمّتنا
              </span>
            </Link>
          </div>

          <div className="flex flex-col gap-2">
            <NavLinks />

            <div className="mt-3 border-t border-white/10 pt-3">
              {authState.loading ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                  جارٍ التحميل...
                </div>
              ) : authState.isLoggedIn ? (
                <div className="space-y-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                    {authState.username || "مستخدم"} • الألعاب: {authState.gamesRemaining}
                  </div>

                  <Link
                    href="/game/start"
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-300"
                  >
                    ابدأ الآن
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-200 transition hover:bg-red-500/15"
                  >
                    تسجيل الخروج
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/register"
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-300"
                  >
                    إنشاء حساب
                  </Link>

                  <Link
                    href="/login"
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10"
                  >
                    تسجيل الدخول
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}