import { redirect } from "next/navigation";
import GameBoardClient from "./game-board-client";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function GameBoardPage({
  searchParams,
}: {
  searchParams: Promise<{
    sessionId?: string;
  }>;
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

  const { data: session } = await supabase
    .from("game_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (!session) {
    redirect("/game/start");
  }

  const categoryIds = Array.isArray(session.selected_category_ids)
    ? session.selected_category_ids
    : [];

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug, image_url")
    .in("id", categoryIds)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const { data: questions } = await supabase
    .from("questions")
    .select(`
      id,
      question_text,
      answer_text,
      points,
      is_active,
      is_used,
      category_id,
      media_type,
      media_url,
      year_tolerance_before,
      year_tolerance_after
    `)
    .in("category_id", categoryIds)
    .eq("is_active", true);

  return (
    <GameBoardClient
      sessionId={session.id}
      userId={user.id}
      initialBoardState={(session.board_state as Record<string, unknown>) ?? {}}
      gameName={session.game_name}
      teamOne={session.team_one_name}
      teamTwo={session.team_two_name}
      categories={categories ?? []}
      questions={questions ?? []}
    />
  );
}