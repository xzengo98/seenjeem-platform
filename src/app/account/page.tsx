"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Profile = {
  email: string | null;
  username: string | null;
  phone: string | null;
  role: string;
  games_remaining: number;
  games_played: number;
  created_at: string | null;
};

type ActiveSession = {
  id: string;
  game_name: string;
  team_one_name: string;
  team_two_name: string;
  team_one_score: number;
  team_two_score: number;
  created_at: string | null;
  status: string;
};

export default function AccountPage() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);

  useEffect(() => {
    let mounted = true;

    async function loadAccount() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (!user) {
        router.replace("/login");
        return;
      }

      const [{ data: profileData }, { data: sessionsData }] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "email, username, phone, role, games_remaining, games_played, created_at"
          )
          .eq("id", user.id)
          .single(),
        supabase
          .from("game_sessions")
          .select(
            "id, game_name, team_one_name, team_two_name, team_one_score, team_two_score, created_at, status"
          )
          .eq("user_id", user.id)
          .eq("status", "active")
          .order("created_at", { ascending: false }),
      ]);

      if (!mounted) return;

      setProfile((profileData as Profile | null) ?? null);
      setActiveSessions(
        Array.isArray(sessionsData) ? (sessionsData as ActiveSession[]) : []
      );
      setLoading(false);
    }

    loadAccount();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace("/login");
      } else {
        loadAccount();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 md:py-12 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-6xl rounded-[1.75rem] border border-white/10 bg-white/5 p-6 text-center md:rounded-[2.5rem] md:p-10">
          جارٍ تحميل بيانات الحساب...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 md:py-12 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-6xl space-y-6 md:space-y-8">
        <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 md:rounded-[2.5rem] md:p-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-black md:text-5xl">حسابي</h1>
              <p className="mt-3 text-sm leading-7 text-slate-300 md:text-base">
                معلومات حسابك وإحصائيات استخدامك للمنصة.
              </p>
            </div>

            <Link
              href="/game/start"
              className="rounded-2xl bg-cyan-400 px-5 py-3 text-center font-bold text-slate-950"
            >
              إنشاء لعبة جديدة
            </Link>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4 md:mt-10 md:gap-6">
            <div className="rounded-[1.5rem] border border-white/10 bg-slate-900/60 p-5 text-center md:rounded-[2rem] md:p-6">
              <div className="text-sm text-slate-400">الألعاب المتبقية</div>
              <div className="mt-3 text-4xl font-black text-cyan-300 md:text-5xl">
                {profile?.games_remaining ?? 0}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-slate-900/60 p-5 text-center md:rounded-[2rem] md:p-6">
              <div className="text-sm text-slate-400">عدد الألعاب التي لعبها</div>
              <div className="mt-3 text-4xl font-black text-cyan-300 md:text-5xl">
                {profile?.games_played ?? 0}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-slate-900/60 p-5 text-center md:rounded-[2rem] md:p-6">
              <div className="text-sm text-slate-400">الدور</div>
              <div className="mt-3 text-2xl font-black text-white md:text-3xl">
                {profile?.role ?? "user"}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-slate-900/60 p-5 text-center md:rounded-[2rem] md:p-6">
              <div className="text-sm text-slate-400">تاريخ إنشاء الحساب</div>
              <div className="mt-3 text-base font-bold text-white md:text-lg">
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString("ar-EG")
                  : "-"}
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:mt-10 md:gap-6 md:grid-cols-2">
            <div className="rounded-[1.5rem] border border-white/10 bg-slate-900/60 p-5 md:rounded-[2rem] md:p-6">
              <div className="text-sm text-slate-400">اسم المستخدم</div>
              <div className="mt-3 break-words text-xl font-black md:text-2xl">
                {profile?.username || "-"}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-slate-900/60 p-5 md:rounded-[2rem] md:p-6">
              <div className="text-sm text-slate-400">البريد الإلكتروني</div>
              <div className="mt-3 break-all text-xl font-black md:text-2xl">
                {profile?.email || "-"}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-slate-900/60 p-5 md:col-span-2 md:rounded-[2rem] md:p-6">
              <div className="text-sm text-slate-400">رقم الهاتف</div>
              <div className="mt-3 break-words text-xl font-black md:text-2xl">
                {profile?.phone || "-"}
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap md:mt-10 md:gap-4">
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-2xl border border-red-500/20 bg-red-500/10 px-6 py-3 font-semibold text-red-300"
            >
              تسجيل الخروج
            </button>

            <Link
              href="/"
              className="rounded-2xl border border-white/10 px-6 py-3 text-center font-semibold text-slate-300"
            >
              العودة للرئيسية
            </Link>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 md:rounded-[2.5rem] md:p-10">
          <div>
            <h2 className="text-2xl font-black md:text-3xl">الألعاب غير المكتملة</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300 md:text-base">
              يمكنك الرجوع لأي لعبة لم تنتهِ بعد وإكمالها من نفس المكان.
            </p>
          </div>

          <div className="mt-6 space-y-4 md:mt-8">
            {activeSessions.length > 0 ? (
              activeSessions.map((session) => (
                <div
                  key={session.id}
                  className="rounded-[1.5rem] border border-white/10 bg-slate-900/60 p-5 md:rounded-[2rem] md:p-6"
                >
                  <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr_auto] lg:items-center lg:gap-6">
                    <div>
                      <div className="text-xl font-black text-white md:text-2xl">
                        {session.game_name}
                      </div>
                      <div className="mt-2 text-sm leading-7 text-slate-300 md:text-base">
                        {session.team_one_name} ({session.team_one_score ?? 0}) ×{" "}
                        {session.team_two_name} ({session.team_two_score ?? 0})
                      </div>
                      <div className="mt-2 text-xs text-slate-500 md:text-sm">
                        {session.created_at
                          ? new Date(session.created_at).toLocaleDateString("ar-EG")
                          : "-"}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-center text-sm text-cyan-300">
                      الحالة: نشطة
                    </div>

                    <div>
                      <Link
                        href={`/game/board?sessionId=${session.id}`}
                        className="block rounded-2xl bg-cyan-400 px-5 py-3 text-center font-bold text-slate-950"
                      >
                        متابعة اللعبة
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-white/10 bg-slate-900/60 px-5 py-8 text-center text-sm text-slate-400 md:rounded-[2rem] md:px-6 md:py-10 md:text-base">
                لا توجد ألعاب غير مكتملة حاليًا.
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}