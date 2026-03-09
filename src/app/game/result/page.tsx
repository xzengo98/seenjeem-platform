import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type SearchParams = Promise<{
  sessionId?: string;
  gameName?: string;
  teamOne?: string;
  teamTwo?: string;
  teamOneScore?: string;
  teamTwoScore?: string;
}>;

export const dynamic = "force-dynamic";

export default async function GameResultPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  const sessionId = params.sessionId;
  const gameName = params.gameName ?? "اللعبة";
  const teamOne = params.teamOne ?? "الفريق الأول";
  const teamTwo = params.teamTwo ?? "الفريق الثاني";
  const teamOneScore = Number(params.teamOneScore ?? 0);
  const teamTwoScore = Number(params.teamTwoScore ?? 0);

  if (!sessionId) {
    redirect("/game/start");
  }

  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const winnerTeam =
    teamOneScore > teamTwoScore
      ? teamOne
      : teamTwoScore > teamOneScore
      ? teamTwo
      : "تعادل";

  await supabase.rpc("finish_game_session", {
    p_session_id: sessionId,
    p_user_id: user.id,
    p_team_one_score: teamOneScore,
    p_team_two_score: teamTwoScore,
    p_winner_team: winnerTeam,
    p_board_state: {},
  });

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-[2.5rem] border border-white/10 bg-white/5 p-10">
          <div className="text-center">
            <div className="text-sm text-slate-400">نتيجة اللعبة</div>
            <h1 className="mt-3 text-5xl font-black">{gameName}</h1>
            <p className="mt-4 text-lg text-slate-300">
              تم حفظ النتيجة وتحديث رصيد الألعاب تلقائيًا.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-[2rem] border border-white/10 bg-slate-900/60 p-8 text-center">
              <div className="text-2xl font-black">{teamOne}</div>
              <div className="mt-4 text-6xl font-black text-cyan-300">
                {teamOneScore}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-slate-900/60 p-8 text-center">
              <div className="text-2xl font-black">{teamTwo}</div>
              <div className="mt-4 text-6xl font-black text-cyan-300">
                {teamTwoScore}
              </div>
            </div>
          </div>

          <div className="mt-10 rounded-[2rem] border border-emerald-500/20 bg-emerald-500/10 p-8 text-center">
            <div className="text-lg text-slate-300">الفائز</div>
            <div className="mt-3 text-4xl font-black text-emerald-300">
              {winnerTeam}
            </div>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/game/start"
              className="rounded-[2rem] bg-cyan-400 px-8 py-4 text-xl font-black text-slate-950"
            >
              بدء لعبة جديدة
            </Link>

            <Link
              href="/account"
              className="rounded-[2rem] border border-white/10 px-8 py-4 text-xl font-black text-slate-200"
            >
              حسابي
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}