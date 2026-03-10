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
    .select("id, username, email, phone, role, games_remaining, games_played, created_at")
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

  const unfinishedGames = allSessions.filter(
    (game) => game.status !== "finished"
  );

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

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white md:px-6 md:py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-3xl font-black md:text-4xl">حسابي</h1>
              <p className="mt-2 text-slate-300">
                معلومات حسابك وإحصائيات استخدامك للمنصة.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/"
                className="rounded-2xl border border-white/10 px-5 py-3 font-semibold text-slate-300"
              >
                العودة للرئيسية
              </Link>
              <Link
                href="/logout"
                className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-3 font-semibold text-red-300"
              >
                تسجيل الخروج
              </Link>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 md:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black">بيانات الحساب</h2>
              <p className="mt-2 text-slate-300">
                بياناتك الأساسية وعدد الألعاب المتاحة.
              </p>
            </div>

            <Link
              href="/game/start"
              className="rounded-2xl bg-cyan-400 px-5 py-3 font-black text-slate-950"
            >
              إنشاء لعبة جديدة
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InfoCard label="اسم المستخدم" value={profile?.username || "-"} />
            <InfoCard label="البريد الإلكتروني" value={profile?.email || user.email || "-"} />
            <InfoCard label="رقم الهاتف" value={profile?.phone || "-"} />
            <InfoCard label="الدور" value={profile?.role || "user"} />
            <InfoCard
              label="الألعاب المتبقية"
              value={String(profile?.games_remaining ?? 0)}
            />
            <InfoCard
              label="عدد الألعاب التي لعبها"
              value={String(profile?.games_played ?? 0)}
            />
            <InfoCard
              label="تاريخ إنشاء الحساب"
              value={formatDate(profile?.created_at ?? null)}
            />
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 md:p-6">
          <div className="mb-5">
            <h2 className="text-2xl font-black">الألعاب غير المكتملة</h2>
            <p className="mt-2 text-slate-300">
              يمكنك الرجوع لأي لعبة لم تنتهِ بعد وإكمالها من نفس المكان، أو حذفها نهائيًا.
            </p>
          </div>

          {unfinishedGames.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 text-center text-slate-300">
              لا توجد ألعاب غير مكتملة حاليًا.
            </div>
          ) : (
            <div className="space-y-4">
              {unfinishedGames.map((game) => (
                <div
                  key={game.id}
                  className="rounded-[1.75rem] border border-white/10 bg-slate-900/40 p-4 md:p-5"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2 text-right">
                      <div className="text-2xl font-black">{game.game_name}</div>
                      <div className="text-slate-300">
                        {game.team_one_name} ({game.team_one_score ?? 0}) ×{" "}
                        {game.team_two_name} ({game.team_two_score ?? 0})
                      </div>
                      <div className="text-sm text-slate-400">
                        {formatDate(game.created_at)}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-sm font-bold text-cyan-300">
                        الحالة: {game.status || "نشطة"}
                      </div>

                      <Link
                        href={`/game/board?sessionId=${game.id}`}
                        className="rounded-2xl bg-cyan-400 px-5 py-3 font-black text-slate-950"
                      >
                        متابعة اللعبة
                      </Link>

                      <form action={deleteUnfinishedGame}>
                        <input type="hidden" name="sessionId" value={game.id} />
                        <button
                          type="submit"
                          className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-3 font-bold text-red-300"
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
        </div>
      </div>
    </main>
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
    <div className="rounded-[1.5rem] border border-white/10 bg-slate-900/40 p-5">
      <div className="text-sm text-slate-400">{label}</div>
      <div className="mt-3 break-words text-2xl font-black text-white">
        {value}
      </div>
    </div>
  );
}