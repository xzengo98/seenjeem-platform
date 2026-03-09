import { getSupabaseServerClient } from "@/lib/supabase/server";
import GameBoardClient from "./game-board-client";

export const dynamic = "force-dynamic";

type Category = {
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
};

type PageProps = {
  searchParams: Promise<{
    gameName?: string;
    teamOne?: string;
    teamTwo?: string;
    categories?: string;
  }>;
};

export default async function GameBoardPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const gameName = (params.gameName ?? "").trim();
  const teamOne = (params.teamOne ?? "").trim();
  const teamTwo = (params.teamTwo ?? "").trim();
  const categorySlugs = (params.categories ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!gameName || !teamOne || !teamTwo || categorySlugs.length === 0) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-20 text-white">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-white/10 bg-white/5 p-8">
          <h1 className="text-3xl font-black">بيانات اللعبة غير مكتملة</h1>
          <p className="mt-4 text-slate-300">
            ارجع إلى صفحة بدء اللعبة وأدخل اسم اللعبة واسمَي الفريقين واختر الفئات.
          </p>
          <a
            href="/game/start"
            className="mt-6 inline-block rounded-2xl bg-cyan-400 px-5 py-3 font-bold text-slate-950"
          >
            الرجوع لبدء اللعبة
          </a>
        </div>
      </main>
    );
  }

  const supabase = await getSupabaseServerClient();

  const { data: categoriesData, error: categoriesError } = await supabase
    .from("categories")
    .select("id, name, slug, image_url")
    .in("slug", categorySlugs)
    .eq("is_active", true);

  if (categoriesError) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-20 text-white">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-red-500/20 bg-red-500/10 p-8 text-red-200">
          فشل تحميل الفئات: {categoriesError.message}
        </div>
      </main>
    );
  }

  const categories = ((categoriesData ?? []) as Category[]).sort(
    (a, b) => categorySlugs.indexOf(a.slug) - categorySlugs.indexOf(b.slug)
  );

  const categoryIds = categories.map((category) => category.id);

  const { data: questionsData, error: questionsError } = await supabase
    .from("questions")
    .select("id, question_text, answer_text, points, is_active, is_used, category_id")
    .in("category_id", categoryIds)
    .eq("is_active", true)
    .order("points", { ascending: true });

  if (questionsError) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-20 text-white">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-red-500/20 bg-red-500/10 p-8 text-red-200">
          فشل تحميل الأسئلة: {questionsError.message}
        </div>
      </main>
    );
  }

  const questions = (questionsData ?? []) as QuestionRow[];

  return (
    <GameBoardClient
      gameName={gameName}
      teamOne={teamOne}
      teamTwo={teamTwo}
      categories={categories}
      questions={questions}
    />
  );
}