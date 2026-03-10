"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Profile = {
  games_remaining: number;
  username: string | null;
};

export default function HomePage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [gamesRemaining, setGamesRemaining] = useState(0);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadState() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (!user) {
        setIsLoggedIn(false);
        setGamesRemaining(0);
        setUsername(null);
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("games_remaining, username")
        .eq("id", user.id)
        .single();

      if (!mounted) return;

      const typedProfile = profile as Profile | null;

      setIsLoggedIn(true);
      setGamesRemaining(typedProfile?.games_remaining ?? 0);
      setUsername(typedProfile?.username ?? null);
      setLoading(false);
    }

    loadState();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadState();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 md:py-12 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5 shadow-[0_30px_100px_-40px_rgba(0,0,0,0.8)] md:rounded-[2.8rem]">
          <div className="bg-gradient-to-l from-cyan-400/10 via-transparent to-transparent px-4 py-10 sm:px-6 md:px-10 md:py-14 lg:px-14 lg:py-16">
            <div className="mx-auto max-w-4xl text-center">
              <div className="mb-4 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-bold text-cyan-300 sm:text-sm">
                منصة عربية متكاملة لألعاب المعلومات
              </div>

              <h1 className="text-3xl font-black leading-tight sm:text-4xl md:text-6xl lg:text-7xl">
                منصة ألعاب أسئلة عربية
                <span className="mt-3 block text-cyan-400 md:mt-4">
                  احترافية وسهلة الإدارة
                </span>
              </h1>

              <p className="mx-auto mt-6 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base md:mt-8 md:text-lg md:leading-8">
                أنشئ جولات أسئلة تفاعلية بين فريقين، رتّب الأقسام والفئات
                والأسئلة من لوحة تحكم احترافية، وابدأ اللعب بطريقة أنيقة وسريعة
                تناسب الفعاليات، المدارس، المسابقات، والمناسبات الخاصة.
              </p>

              {loading ? (
                <div className="mt-8 text-sm text-slate-400 md:mt-10 md:text-base">
                  جارٍ تحميل حالتك...
                </div>
              ) : isLoggedIn ? (
                <div className="mt-8 space-y-5 md:mt-10 md:space-y-6">
                  <div className="text-sm text-slate-300 sm:text-base md:text-lg">
                    أهلاً{" "}
                    <span className="font-black text-cyan-300">
                      {username || "بك"}
                    </span>
                    {" • "}
                    عدد الألعاب المتبقية:{" "}
                    <span className="font-black text-cyan-300">
                      {gamesRemaining}
                    </span>
                  </div>

                  <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                    <Link
                      href="/game/start"
                      className="rounded-[1.5rem] bg-cyan-400 px-6 py-3 text-center text-base font-black text-slate-950 sm:px-8 sm:py-4 sm:text-lg md:rounded-[2rem] md:text-xl"
                    >
                      ابدأ الآن
                    </Link>

                    <Link
                      href="/account"
                      className="rounded-[1.5rem] border border-white/10 px-6 py-3 text-center text-base font-black text-slate-200 sm:px-8 sm:py-4 sm:text-lg md:rounded-[2rem] md:text-xl"
                    >
                      حسابي
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center md:mt-10 md:gap-4">
                  <Link
                    href="/register"
                    className="rounded-[1.5rem] bg-cyan-400 px-6 py-3 text-center text-base font-black text-slate-950 sm:px-8 sm:py-4 sm:text-lg md:rounded-[2rem] md:text-xl"
                  >
                    إنشاء حساب جديد
                  </Link>

                  <Link
                    href="/login"
                    className="rounded-[1.5rem] border border-white/10 px-6 py-3 text-center text-base font-black text-slate-200 sm:px-8 sm:py-4 sm:text-lg md:rounded-[2rem] md:text-xl"
                  >
                    تسجيل الدخول
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:mt-10 md:gap-6 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 md:rounded-[2rem] md:p-6">
            <h3 className="text-xl font-black md:text-2xl">إدارة احترافية</h3>
            <p className="mt-3 text-sm leading-7 text-slate-300 md:text-base md:leading-8">
              تحكم كامل بالأقسام الرئيسية والفئات والأسئلة من واجهة إدارة واضحة
              وسريعة.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 md:rounded-[2rem] md:p-6">
            <h3 className="text-xl font-black md:text-2xl">لعب بين فريقين</h3>
            <p className="mt-3 text-sm leading-7 text-slate-300 md:text-base md:leading-8">
              جهّز اسم اللعبة والفريقين وابدأ 
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 md:rounded-[2rem] md:p-6 md:col-span-2 xl:col-span-1">
            <h3 className="text-xl font-black md:text-2xl">جاهزة للتطوير</h3>
            <p className="mt-3 text-sm leading-7 text-slate-300 md:text-base md:leading-8">
              بنية مرنة تسمح بإضافة نتائج، جلسات محفوظة، أرصدة، وباقات استخدام لاحقًا.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}