import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import GameBoardClient from "./game-board-client";

type SearchParams = Promise<{
  sessionId?: string;
}>;

type SessionRow = {
  id: string;
  user_id: string;
  game_name: string;
  team_one_name: string;
  team_two_name: string;
  selected_categories: string[] | null;
  status: string;
};

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

export const dynamic = "force-dynamic";

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

  const { data: session, error: sessionError } = await supabase
    .from("game_sessions")
    .select("id, user_id, game_name, team_one_name, team_two_name, selected_categories, status")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (sessionError || !session) {
    redirect("/game/start");
  }

  const typedSession = session as SessionRow;

  if (typedSession.status !== "active") {
    redirect("/game/result?sessionId=" + typedSession.id);
  }

  const selectedSlugs = Array.isArray(typedSession.selected_categories)
    ? typedSession.selected_categories
    : [];

  if (selectedSlugs.length === 0) {
    redirect("/game/start");
  }

  const { data: categoriesData } = await supabase
    .from("categories")
    .select("id, name, slug, image_url")
    .in("slug", selectedSlugs)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const categories: Category[] = Array.isArray(categoriesData)
    ? (categoriesData as Category[])
    : [];

  const categoryIds = categories.map((item) => item.id);

  const { data: questionsData } =
    categoryIds.length > 0
      ? await supabase
          .from("questions")
          .select(
            "id, question_text, answer_text, points, is_active, is_used, category_id"
          )
          .in("category_id", categoryIds)
          .eq("is_active", true)
      : { data: [] as QuestionRow[] };

  const questions: QuestionRow[] = Array.isArray(questionsData)
    ? (questionsData as QuestionRow[])
    : [];

  return (
    <GameBoardClient
      sessionId={typedSession.id}
      gameName={typedSession.game_name}
      teamOne={typedSession.team_one_name}
      teamTwo={typedSession.team_two_name}
      categories={categories}
      questions={questions}
    />
  );
}