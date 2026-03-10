import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type GameSessionRow = {
  id: string;
  game_name: string;
  team_one_name: string;
  team_two_name: string;
  team_one_score: number | null;
  team_two_score: number | null;
  winner_team: string | null;
  status: string | null;
  created_at: string | null;
  finished_at: string | null;
};

export default async function AdminGamesPage() {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/");
  }

  const { data: gamesData, error } = await supabase
    .from("game_sessions")
    .select(`
      id,
      game_name,
      team_one_name,
      team_two_name,
      team_one_score,
      team_two_score,
      winner_team,
      status,
      created_at,
      finished_at
    `)
    .order("created_at", { ascending: false });

  const games = ((gamesData ?? []) as GameSessionRow[]).filter(
    (game) => game.status === "finished"
  );

  async function deleteSingleGame(formData: FormData) {
    "use server";

    const supabase = await getSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      redirect("/");
    }

    const gameId = formData.get("gameId")?.toString();

    if (!gameId) {
      redirect("/admin/games");
    }

    await supabase
      .from("game_sessions")
      .delete()
      .eq("id", gameId)
      .eq("status", "finished");

    redirect("/admin/games");
  }

  async function deleteSelectedGames(formData: FormData) {
    "use server";

    const supabase = await getSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      redirect("/");
    }

    const selectedIds = formData.getAll("selectedGameIds").map(String).filter(Boolean);

    if (selectedIds.length === 0) {
      redirect("/admin/games");
    }

    await supabase
      .from("game_sessions")
      .delete()
      .in("id", selectedIds)
      .eq("status", "finished");

    redirect("/admin/games");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white md:px-6 md:py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-[2rem] border border-white/10 bg-white/5 p-5 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-black md:text-4xl">إدارة الألعاب المنتهية</h1>
              <p className="mt-2 text-slate-300">
                من هنا يمكنك حذف الألعاب المنتهية فرديًا أو تحديد عدة ألعاب وحذفها دفعة واحدة.
              </p>
            </div>

            <Link
              href="/admin"
              className="rounded-2xl border border-white/10 px-5 py-3 font-semibold text-slate-300"
            >
              العودة للوحة التحكم
            </Link>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-red-200">
            فشل تحميل الألعاب: {error.message}
          </div>
        ) : null}

        <GamesManagerTable
          games={games}
          deleteSelectedGames={deleteSelectedGames}
          deleteSingleGame={deleteSingleGame}
        />
      </div>
    </main>
  );
}

function GamesManagerTable({
  games,
  deleteSelectedGames,
  deleteSingleGame,
}: {
  games: GameSessionRow[];
  deleteSelectedGames: (formData: FormData) => Promise<void>;
  deleteSingleGame: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={deleteSelectedGames} className="rounded-[2rem] border border-white/10 bg-white/5 p-4 md:p-6">
      <ClientSelectionToolbar />

      {games.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 text-center text-slate-300">
          لا توجد ألعاب منتهية حاليًا.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] border-separate border-spacing-y-3">
            <thead>
              <tr className="text-right text-sm text-slate-400">
                <th className="px-3 py-2">تحديد</th>
                <th className="px-3 py-2">اسم اللعبة</th>
                <th className="px-3 py-2">الفريق الأول</th>
                <th className="px-3 py-2">الفريق الثاني</th>
                <th className="px-3 py-2">النتيجة</th>
                <th className="px-3 py-2">الفائز</th>
                <th className="px-3 py-2">الحالة</th>
                <th className="px-3 py-2">تاريخ الإنشاء</th>
                <th className="px-3 py-2">تاريخ الانتهاء</th>
                <th className="px-3 py-2">إجراء</th>
              </tr>
            </thead>

            <tbody>
              {games.map((game) => (
                <tr key={game.id} className="rounded-2xl bg-slate-900/60">
                  <td className="px-3 py-4">
                    <input
                      type="checkbox"
                      name="selectedGameIds"
                      value={game.id}
                      className="game-checkbox h-5 w-5"
                    />
                  </td>

                  <td className="px-3 py-4 font-bold text-white">{game.game_name}</td>
                  <td className="px-3 py-4">{game.team_one_name}</td>
                  <td className="px-3 py-4">{game.team_two_name}</td>
                  <td className="px-3 py-4">
                    {(game.team_one_score ?? 0)} - {(game.team_two_score ?? 0)}
                  </td>
                  <td className="px-3 py-4">{game.winner_team || "-"}</td>
                  <td className="px-3 py-4">
                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
                      {game.status || "-"}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-sm text-slate-300">
                    {formatDate(game.created_at)}
                  </td>
                  <td className="px-3 py-4 text-sm text-slate-300">
                    {formatDate(game.finished_at)}
                  </td>
                  <td className="px-3 py-4">
                    <form action={deleteSingleGame}>
                      <input type="hidden" name="gameId" value={game.id} />
                      <button
                        type="submit"
                        className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-300"
                      >
                        حذف
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </form>
  );
}

function ClientSelectionToolbar() {
  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="text-lg font-black">قائمة الألعاب المنتهية</div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              document
                .querySelectorAll<HTMLInputElement>(".game-checkbox")
                .forEach((checkbox) => {
                  checkbox.checked = true;
                });
            }}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300"
          >
            تحديد الكل
          </button>

          <button
            type="button"
            onClick={() => {
              document
                .querySelectorAll<HTMLInputElement>(".game-checkbox")
                .forEach((checkbox) => {
                  checkbox.checked = false;
                });
            }}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300"
          >
            إلغاء التحديد
          </button>

          <button
            type="submit"
            className="rounded-xl bg-red-600 px-5 py-2 text-sm font-black text-white"
          >
            حذف المحدد
          </button>
        </div>
      </div>
    </>
  );
}

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