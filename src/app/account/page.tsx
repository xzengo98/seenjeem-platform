import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ProfileRow = {
  id: string;
  username: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  games_remaining: number | null;
  games_played: number | null;
  created_at: string | null;
};

type GameSessionRow = {
  id: string;
  game_name: string;
  team_one_name: string;
  team_two_name: string;
  team_one_score: number | null;
  team_two_score: number | null;
  status: string | null;
  created_at: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "-";

  try {
    return new Intl.DateTimeFormat("ar", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function getStatusLabel(status: string | null) {
  if (!status) return "نشطة";
  if (status === "finished") return "منتهية";
  if (status === "active") return "نشطة";
  return status;
}

function getRoleLabel(role: string | null) {
  if (!role) return "user";
  return role;
}

export default async function AccountPage() {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select(
      "id, username, email, phone, role, games_remaining, games_played, created_at"
    )
    .eq("id", user.id)
    .single();

  const profile = profileData as ProfileRow | null;

  const { data: sessionsData } = await supabase
    .from("game_sessions")
    .select(`
      id,
      game_name,
      team_one_name,
      team_two_name,
      team_one_score,
      team_two_score,
      status,
      created_at
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const allSessions = (sessionsData ?? []) as GameSessionRow[];
  const unfinishedGames = allSessions.filter((game) => game.status !== "finished");

  async function deleteUnfinishedGame(formData: FormData) {
    "use server";

    const supabase = await getSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const sessionId = formData.get("sessionId")?.toString();

    if (!sessionId) {
      redirect("/account");
    }

    const { data: session } = await supabase
      .from("game_sessions")
      .select("id, user_id, status")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single();

    if (!session) {
      redirect("/account");
    }

    if (session.status === "finished") {
      redirect("/account");
    }

    await supabase
      .from("game_sessions")
      .delete()
      .eq("id", sessionId)
      .eq("user_id", user.id);

    revalidatePath("/account");
    redirect("/account");
  }

  const username = profile?.username || "مستخدم";
  const email = profile?.email || user.email || "-";
  const phone = profile?.phone || "-";
  const role = getRoleLabel(profile?.role ?? null);
  const gamesRemaining = profile?.games_remaining ?? 0;
  const gamesPlayed = profile?.games_played ?? 0;
  const createdAt = formatDate(profile?.created_at ?? null);

  return (
    <main dir="rtl" className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-10 pt-6 sm:px-6 lg:gap-8 lg:px-8 lg:pb-16 lg:pt-10">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 px-5 py-6 shadow-2xl shadow-slate-950/40 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.16),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.14),transparent_30%)]" />
          <div className="relative grid gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
                <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-cyan-200">
                  صفحة الحساب
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-slate-300">
                  إدارة معلوماتك وألعابك
                </span>
              </div>

              <h1 className="mt-4 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
                أهلاً {username}
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base sm:leading-8">
                من هنا يمكنك مراجعة بيانات الحساب، متابعة الجلسات غير المكتملة،
                وبدء لعبة جديدة..
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/game/start"
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-cyan-400 px-5 py-3 text-base font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-300"
                >
                  إنشاء لعبة جديدة
                </Link>

                <Link
                  href="/"
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-base font-bold text-white transition hover:bg-white/10"
                >
                  العودة للرئيسية
                </Link>

                <Link
                  href="/logout"
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-3 text-base font-bold text-red-300 transition hover:bg-red-500/15"
                >
                  تسجيل الخروج
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <HeroStatCard
                label="الألعاب المتبقية"
                value={String(gamesRemaining)}
                accent="cyan"
              />
              <HeroStatCard
                label="الألعاب التي لُعبت"
                value={String(gamesPlayed)}
                accent="orange"
              />
              <HeroStatCard
                label="الألعاب غير المكتملة"
                value={String(unfinishedGames.length)}
                accent="emerald"
              />
              <HeroStatCard label="الدور" value={role} accent="slate" />
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 sm:p-6 lg:p-8">
          <SectionHeader
            eyebrow="بيانات الحساب"
            title="معلوماتك الأساسية"
            description="هنا تظهر جميع معلومات الخاصة بحسابك الشخصي :"
          />

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <InfoCard label="اسم المستخدم" value={username} />
            <InfoCard label="البريد الإلكتروني" value={email} />
            <InfoCard label="رقم الهاتف" value={phone} />
            <InfoCard label="الدور" value={role} />
            <InfoCard label="الألعاب المتبقية" value={String(gamesRemaining)} />
            <InfoCard label="عدد الألعاب التي لعبتها" value={String(gamesPlayed)} />
            <InfoCard label="تاريخ إنشاء الحساب" value={createdAt} wide />
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 sm:p-6 lg:p-8">
          <SectionHeader
            eyebrow="الجلسات الحالية"
            title="الألعاب غير المكتملة"
            description="يمكنك الرجوع لأي لعبة لم تنتهِ بعد وإكمالها من نفس المكان، أو حذفها نهائيًا."
          />

          {unfinishedGames.length === 0 ? (
            <div className="mt-6 rounded-[1.75rem] border border-white/10 bg-slate-900/50 p-6 text-center sm:p-8">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
                ✓
              </div>
              <h3 className="mt-4 text-xl font-black text-white sm:text-2xl">
                لا توجد ألعاب غير مكتملة حاليًا
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base">
                عندما تبدأ لعبة جديدة وتتوقف قبل إنهائها، ستظهر هنا لتتمكن من
                متابعتها لاحقًا.
              </p>
              <div className="mt-5">
                <Link
                  href="/game/start"
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-cyan-400 px-5 py-3 text-base font-black text-slate-950 transition hover:bg-cyan-300"
                >
                  إنشاء لعبة جديدة
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 xl:grid-cols-2">
              {unfinishedGames.map((game) => (
                <div
                  key={game.id}
                  className="rounded-[1.75rem] border border-white/10 bg-slate-900/50 p-4 sm:p-5"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs text-cyan-300 sm:text-sm">
                          جلسة غير مكتملة
                        </p>
                        <h3 className="mt-1 break-words text-2xl font-black text-white sm:text-3xl">
                          {game.game_name}
                        </h3>
                      </div>

                      <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-bold text-cyan-200 sm:text-sm">
                        الحالة: {getStatusLabel(game.status ?? null)}
                      </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <MiniInfoCard
                        label="الفريق الأول"
                        value={`${game.team_one_name} (${game.team_one_score ?? 0})`}
                      />
                      <MiniInfoCard
                        label="الفريق الثاني"
                        value={`${game.team_two_name} (${game.team_two_score ?? 0})`}
                      />
                    </div>

                    <div className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3">
                      <p className="text-xs text-slate-400 sm:text-sm">
                        تاريخ الإنشاء
                      </p>
                      <p className="mt-2 text-sm font-bold text-white sm:text-base">
                        {formatDate(game.created_at)}
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <Link
                        href={`/game/board?sessionId=${game.id}`}
                        className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-cyan-400 px-5 py-3 text-base font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-300"
                      >
                        متابعة اللعبة
                      </Link>

                      <form action={deleteUnfinishedGame}>
                        <input type="hidden" name="sessionId" value={game.id} />
                        <button
                          type="submit"
                          className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-3 text-base font-bold text-red-300 transition hover:bg-red-500/15"
                        >
                          حذف اللعبة
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="text-sm font-medium text-cyan-300">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base sm:leading-8">
        {description}
      </p>
    </div>
  );
}

function HeroStatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "cyan" | "orange" | "emerald" | "slate";
}) {
  const accentClass =
    accent === "cyan"
      ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-200"
      : accent === "orange"
      ? "border-orange-400/20 bg-orange-400/10 text-orange-100"
      : accent === "emerald"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
      : "border-white/10 bg-white/5 text-white";

  return (
    <div className={`rounded-[1.5rem] border p-4 text-center ${accentClass}`}>
      <p className="text-xs sm:text-sm">{label}</p>
      <p className="mt-2 break-words text-2xl font-black sm:text-3xl">
        {value}
      </p>
    </div>
  );
}

function InfoCard({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div
      className={`rounded-[1.5rem] border border-white/10 bg-slate-900/50 p-5 ${
        wide ? "sm:col-span-2 xl:col-span-1" : ""
      }`}
    >
      <div className="text-sm text-slate-400">{label}</div>
      <div className="mt-3 break-words text-xl font-black leading-relaxed text-white sm:text-2xl">
        {value}
      </div>
    </div>
  );
}

function MiniInfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-xs text-slate-400 sm:text-sm">{label}</p>
      <p className="mt-2 break-words text-sm font-bold text-white sm:text-base">
        {value}
      </p>
    </div>
  );
}