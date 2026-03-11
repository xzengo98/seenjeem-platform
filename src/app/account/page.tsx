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

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function getRoleLabel(role: string | null | undefined) {
  const normalized = String(role ?? "user").toLowerCase();

  if (normalized === "admin") return "ADMIN";
  if (normalized === "vip") return "VIP";
  if (normalized === "premium") return "Premium";
  return "FREE";
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 break-words text-2xl font-black text-white sm:text-3xl">
        {value}
      </p>
    </div>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.35rem] border border-white/10 bg-slate-900/60 p-4">
      <p className="text-xs text-slate-400 sm:text-sm">{label}</p>
      <p className="mt-2 break-words text-base font-black text-white sm:text-lg">
        {value}
      </p>
    </div>
  );
}

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
      <main className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6 lg:px-8 lg:py-10">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-white/5 p-6 text-center text-slate-300">
          جارٍ تحميل بيانات الحساب...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <section className="rounded-[2.25rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.14),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.10),transparent_20%),linear-gradient(135deg,#020617_0%,#08122f_46%,#020617_100%)] p-5 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-bold text-cyan-200 sm:text-sm">
                حسابي
              </span>
              <h1 className="mt-4 text-3xl font-black sm:text-4xl">
                أهلاً {profile?.username || "بك"}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-8 text-slate-300 sm:text-base">
                من هنا يمكنك مراجعة بيانات حسابك، معرفة عدد الألعاب المتبقية،
                ومتابعة الجولات غير المكتملة بسهولة.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/game/start"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-cyan-400 px-6 py-3 text-base font-black text-slate-950 transition hover:bg-cyan-300"
              >
                إنشاء لعبة جديدة
              </Link>
              <button
                onClick={handleLogout}
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 px-6 py-3 text-base font-bold text-red-300 transition hover:bg-red-500/15"
              >
                تسجيل الخروج
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="الألعاب المتبقية" value={profile?.games_remaining ?? 0} />
          <StatCard label="عدد الألعاب التي لعبها" value={profile?.games_played ?? 0} />
          <StatCard label="رتبة الحساب" value={getRoleLabel(profile?.role)} />
          <StatCard label="تاريخ إنشاء الحساب" value={formatDate(profile?.created_at ?? null)} />
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5 sm:p-6">
          <div className="mb-5">
            <h2 className="text-2xl font-black text-white sm:text-3xl">
              بيانات الحساب
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-300">
              معلوماتك الأساسية وحالة الحساب الحالية.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InfoCard label="اسم المستخدم" value={profile?.username || "-"} />
            <InfoCard label="البريد الإلكتروني" value={profile?.email || "-"} />
            <InfoCard label="رقم الهاتف" value={profile?.phone || "-"} />
            <InfoCard label="الدور الداخلي" value={profile?.role || "user"} />
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              العودة للرئيسية
            </Link>
            <Link
              href="/pricing"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-sm font-bold text-cyan-100 transition hover:bg-cyan-400/15"
            >
              استعراض الباقات
            </Link>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5 sm:p-6">
          <div className="mb-5">
            <h2 className="text-2xl font-black text-white sm:text-3xl">
              الألعاب غير المكتملة
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-300">
              يمكنك الرجوع لأي لعبة لم تنتهِ بعد وإكمالها من نفس المكان.
            </p>
          </div>

          {activeSessions.length > 0 ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {activeSessions.map((session) => (
                <div
                  key={session.id}
                  className="rounded-[1.5rem] border border-white/10 bg-slate-900/60 p-5"
                >
                  <div className="flex flex-col gap-4">
                    <div>
                      <p className="text-xs text-cyan-300 sm:text-sm">لعبة محفوظة</p>
                      <h3 className="mt-2 text-xl font-black text-white">
                        {session.game_name}
                      </h3>
                    </div>

                    <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
                      <p className="text-sm text-slate-300">
                        {session.team_one_name} ({session.team_one_score ?? 0}) ×{" "}
                        {session.team_two_name} ({session.team_two_score ?? 0})
                      </p>
                      <p className="mt-2 text-xs text-slate-400">
                        تاريخ الإنشاء: {formatDate(session.created_at)}
                      </p>
                      <p className="mt-1 text-xs text-emerald-300">الحالة: نشطة</p>
                    </div>

                    <Link
                      href={`/game/board?session=${session.id}`}
                      className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-cyan-400 px-5 py-3 text-base font-black text-slate-950 transition hover:bg-cyan-300"
                    >
                      متابعة اللعبة
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-white/10 bg-slate-900/60 p-6 text-center text-slate-300">
              لا توجد ألعاب غير مكتملة حاليًا.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}