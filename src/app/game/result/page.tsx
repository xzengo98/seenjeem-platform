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
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 md:py-12 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 md:rounded-[2.5rem] md:p-10">
          <div className="text-center">
            <div className="text-sm text-slate-400">نتيجة اللعبة</div>
            <h1 className="mt-3 text-3xl font-black md:text-5xl">{gameName}</h1>
            <p className="mt-4 text-sm leading-7 text-slate-300 md:text-lg">
              تم حفظ النتيجة وتحديث رصيد الألعاب تلقائيًا.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:mt-10 md:gap-6 md:grid-cols-2">
            <div className="rounded-[1.5rem] border border-white/10 bg-slate-900/60 p-6 text-center md:rounded-[2rem] md:p-8">
              <div className="text-xl font-black md:text-2xl">{teamOne}</div>
              <div className="mt-4 text-5xl font-black text-cyan-300 md:text-6xl">
                {teamOneScore}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-slate-900/60 p-6 text-center md:rounded-[2rem] md:p-8">
              <div className="text-xl font-black md:text-2xl">{teamTwo}</div>
              <div className="mt-4 text-5xl font-black text-cyan-300 md:text-6xl">
                {teamTwoScore}
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-[1.5rem] border border-emerald-500/20 bg-emerald-500/10 p-6 text-center md:mt-10 md:rounded-[2rem] md:p-8">
            <div className="text-base text-slate-300 md:text-lg">الفائز</div>
            <div className="mt-3 text-3xl font-black text-emerald-300 md:text-4xl">
              {winnerTeam}
            </div>
          </div>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap md:mt-10 md:gap-4">
            <Link
              href="/game/start"
              className="rounded-[1.5rem] bg-cyan-400 px-6 py-3 text-center text-base font-black text-slate-950 md:rounded-[2rem] md:px-8 md:py-4 md:text-xl"
            >
              بدء لعبة جديدة
            </Link>

            <Link
              href="/account"
              className="rounded-[1.5rem] border border-white/10 px-6 py-3 text-center text-base font-black text-slate-200 md:rounded-[2rem] md:px-8 md:py-4 md:text-xl"
            >
              حسابي
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}