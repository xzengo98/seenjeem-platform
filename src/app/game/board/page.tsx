import Link from "next/link";
import { redirect } from "next/navigation";
import GameBoardClient from "./game-board-client";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  sessionId?: string;
}>;

type GameSessionRow = {
  id: string;
  user_id: string;
  game_name: string;
  team_one_name: string;
  team_two_name: string;
  selected_category_ids: string[] | null;
  board_state: Record<string, unknown> | null;
};

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
};

type QuestionRow = {
  id: string;
  question_text: string;
  answer_text: string | null;
  points: number;
  is_active: boolean;
  is_used: boolean;
  category_id: string;
  year_tolerance_before?: number | null;
  year_tolerance_after?: number | null;
};

export default async function GameBoardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const sessionId = params.sessionId;

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

  const { data: sessionData, error: sessionError } = await supabase
    .from("game_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (sessionError || !sessionData) {
    redirect("/game/start");
  }

  const session = sessionData as GameSessionRow;

  const selectedRaw: string[] = Array.isArray(session.selected_category_ids)
    ? session.selected_category_ids.map((value) => String(value))
    : [];

  if (selectedRaw.length === 0) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 text-center sm:p-10">
          <h1 className="text-2xl font-black sm:text-4xl">
            لا توجد فئات في هذه الجلسة
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-lg">
            يبدو أن الجلسة أُنشئت بدون فئات أو لم يتم حفظها بشكل صحيح.
          </p>
          <div className="mt-6">
            <Link
              href="/game/start"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-cyan-400 px-6 py-3 font-bold text-slate-950 transition hover:bg-cyan-300"
            >
              الرجوع لإنشاء لعبة جديدة
            </Link>
          </div>
        </div>
      </main>
    );
  }

  let categories: CategoryRow[] = [];

  const { data: categoriesByIdData } = await supabase
    .from("categories")
    .select("id, name, slug, image_url")
    .in("id", selectedRaw)
    .eq("is_active", true);

  const categoriesById = (categoriesByIdData ?? []) as CategoryRow[];

  if (categoriesById.length > 0) {
    const orderMap = new Map(
      selectedRaw.map((value, index) => [value, index])
    );

    categories = [...categoriesById].sort((a, b) => {
      const aOrder = orderMap.get(a.id) ?? 999;
      const bOrder = orderMap.get(b.id) ?? 999;
      return aOrder - bOrder;
    });
  } else {
    const { data: categoriesBySlugData } = await supabase
      .from("categories")
      .select("id, name, slug, image_url")
      .in("slug", selectedRaw)
      .eq("is_active", true);

    const categoriesBySlug = (categoriesBySlugData ?? []) as CategoryRow[];

    if (categoriesBySlug.length > 0) {
      const orderMap = new Map(
        selectedRaw.map((value, index) => [value, index])
      );

      categories = [...categoriesBySlug].sort((a, b) => {
        const aOrder = orderMap.get(a.slug) ?? 999;
        const bOrder = orderMap.get(b.slug) ?? 999;
        return aOrder - bOrder;
      });
    }
  }

  if (categories.length === 0) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 text-center sm:p-10">
          <h1 className="text-2xl font-black sm:text-4xl">تعذر تحميل الفئات</h1>
          <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-lg">
            الفئات المختارة في الجلسة لم يتم العثور عليها داخل قاعدة البيانات.
          </p>
          <div className="mt-6">
            <Link
              href="/game/start"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-cyan-400 px-6 py-3 font-bold text-slate-950 transition hover:bg-cyan-300"
            >
              الرجوع وإنشاء لعبة جديدة
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { data: sessionQuestionsData } = await supabase
    .from("game_session_questions")
    .select("category_id, question_id, points, slot_index")
    .eq("session_id", session.id)
    .order("category_id", { ascending: true })
    .order("slot_index", { ascending: true });

  let questions: QuestionRow[] = [];

  if ((sessionQuestionsData ?? []).length > 0) {
    const questionIds = (sessionQuestionsData ?? []).map((row) =>
      String(row.question_id)
    );

    const { data: selectedQuestionsData } = await supabase
      .from("questions")
      .select(`
        id,
        question_text,
        answer_text,
        points,
        is_active,
        is_used,
        category_id,
        year_tolerance_before,
        year_tolerance_after
      `)
      .in("id", questionIds)
      .eq("is_active", true);

    const questionMap = new Map(
      ((selectedQuestionsData ?? []) as QuestionRow[]).map((question) => [
        question.id,
        question,
      ])
    );

    questions = (sessionQuestionsData ?? [])
      .map((row) => questionMap.get(String(row.question_id)) ?? null)
      .filter((item): item is QuestionRow => Boolean(item));
  } else {
    const categoryIds = categories.map((category) => category.id);

    const { data: questionsData } = await supabase
      .from("questions")
      .select(`
        id,
        question_text,
        answer_text,
        points,
        is_active,
        is_used,
        category_id,
        year_tolerance_before,
        year_tolerance_after
      `)
      .in("category_id", categoryIds)
      .eq("is_active", true);

    questions = (questionsData ?? []) as QuestionRow[];
  }

  return (
    <GameBoardClient
      sessionId={session.id}
      userId={session.user_id}
      initialBoardState={(session.board_state ?? {}) as Record<string, unknown>}
      gameName={session.game_name}
      teamOne={session.team_one_name}
      teamTwo={session.team_two_name}
      categories={categories}
      questions={questions}
    />
  );
}