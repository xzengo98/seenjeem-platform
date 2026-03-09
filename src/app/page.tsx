import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let gamesRemaining: number | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("games_remaining")
      .eq("id", user.id)
      .single();

    gamesRemaining = profile?.games_remaining ?? 0;
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[2.5rem] border border-white/10 bg-white/5 px-8 py-14 text-center">
          <h1 className="text-5xl font-black leading-tight md:text-7xl">
            منصة ألعاب أسئلة عربية
            <span className="mt-4 block text-cyan-400">احترافية وسهلة الإدارة</span>
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300">
            أنشئ ألعابك، نظّم الفئات والأسئلة، وابدأ جولات ممتعة بين الفرق
            بطريقة احترافية.
          </p>

          {user ? (
            <div className="mt-10 space-y-5">
              <div className="text-lg text-slate-300">
                عدد الألعاب المتبقية:{" "}
                <span className="font-black text-cyan-300">
                  {gamesRemaining ?? 0}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/game/start"
                  className="rounded-[2rem] bg-cyan-400 px-8 py-4 text-xl font-black text-slate-950"
                >
                  ابدأ الآن
                </Link>

                <Link
                  href="/pricing"
                  className="rounded-[2rem] border border-white/10 px-8 py-4 text-xl font-black text-slate-200"
                >
                  عرض الباقات
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/register"
                className="rounded-[2rem] bg-cyan-400 px-8 py-4 text-xl font-black text-slate-950"
              >
                إنشاء حساب جديد
              </Link>

              <Link
                href="/login"
                className="rounded-[2rem] border border-white/10 px-8 py-4 text-xl font-black text-slate-200"
              >
                تسجيل الدخول
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}