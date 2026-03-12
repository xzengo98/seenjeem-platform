import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import StartGameForm from "./start-game-form";

export const dynamic = "force-dynamic";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  section_id: string | null;
  sort_order?: number | null;
};

type CategorySection = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
};

type SearchParams = Promise<{
  error?: string;
}>;

type ProfileForSession = {
  games_remaining: number | null;
  account_tier: string | null;
  role: string | null;
};

type QuestionCandidate = {
  id: string;
  category_id: string;
  points: number;
  created_at: string | null;
};

type SessionQuestionInsertRow = {
  category_id: string;
  question_id: string;
  points: number;
  slot_index: number;
};

type CategoryAvailability = {
  availableGames: number;
  isSelectable: boolean;
  mode: "fixed" | "dynamic";
  easyCount: number;
  mediumCount: number;
  hardCount: number;
};

type HistoryRow = {
  question_id: string;
};

type ServerSupabase = Awaited<ReturnType<typeof getSupabaseServerClient>>;

const REQUIRED_CATEGORY_COUNT = 6;
const QUESTIONS_PER_GAME_PER_LEVEL = 2;
const PAGE_SIZE = 1000;

function shuffleArray<T>(items: T[]) {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function calculateAvailableGames(
  easyCount: number,
  mediumCount: number,
  hardCount: number
) {
  return Math.min(
    Math.floor(easyCount / QUESTIONS_PER_GAME_PER_LEVEL),
    Math.floor(mediumCount / QUESTIONS_PER_GAME_PER_LEVEL),
    Math.floor(hardCount / QUESTIONS_PER_GAME_PER_LEVEL)
  );
}

function buildSessionQuestions(params: {
  selectedCategoryIds: string[];
  allQuestions: QuestionCandidate[];
  usedQuestionIds: Set<string>;
  shouldRandomize: boolean;
  categories: Category[];
}) {
  const {
    selectedCategoryIds,
    allQuestions,
    usedQuestionIds,
    shouldRandomize,
    categories,
  } = params;

  const rows: SessionQuestionInsertRow[] = [];
  const slotStarts = [
    { points: 200, startSlot: 0 },
    { points: 400, startSlot: 2 },
    { points: 600, startSlot: 4 },
  ];

  for (const categoryId of selectedCategoryIds) {
    const categoryName =
      categories.find((item) => item.id === categoryId)?.name ?? "فئة غير معروفة";

    const categoryQuestions = allQuestions.filter(
      (question) => question.category_id === categoryId
    );

    for (const slotGroup of slotStarts) {
      let pool = categoryQuestions.filter(
        (question) => question.points === slotGroup.points
      );

      if (shouldRandomize) {
        pool = pool.filter((question) => !usedQuestionIds.has(question.id));
        pool = shuffleArray(pool);
      } else {
        pool = [...pool].sort((a, b) => {
          const dateCompare = (a.created_at ?? "").localeCompare(b.created_at ?? "");
          if (dateCompare !== 0) return dateCompare;
          return a.id.localeCompare(b.id);
        });
      }

      const picked = pool.slice(0, QUESTIONS_PER_GAME_PER_LEVEL);

      if (picked.length < QUESTIONS_PER_GAME_PER_LEVEL) {
        return {
          error: shouldRandomize
            ? `الفئة "${categoryName}" لا تحتوي على عدد كافٍ من أسئلة ${slotGroup.points} غير المستخدمة.`
            : `الفئة "${categoryName}" لا تحتوي على عدد كافٍ من أسئلة ${slotGroup.points}.`,
          rows: [] as SessionQuestionInsertRow[],
        };
      }

      picked.forEach((question, index) => {
        rows.push({
          category_id: categoryId,
          question_id: question.id,
          points: slotGroup.points,
          slot_index: slotGroup.startSlot + index,
        });
      });
    }
  }

  return { error: null, rows };
}

function buildCategoryAvailability(params: {
  categories: Category[];
  questions: QuestionCandidate[];
  usedQuestionIds: Set<string>;
  mode: "fixed" | "dynamic";
}) {
  const { categories, questions, usedQuestionIds, mode } = params;
  const availabilityMap: Record<string, CategoryAvailability> = {};

  for (const category of categories) {
    const categoryQuestions = questions.filter(
      (question) => question.category_id === category.id
    );

    const filtered =
      mode === "dynamic"
        ? categoryQuestions.filter((question) => !usedQuestionIds.has(question.id))
        : categoryQuestions;

    const easyCount = filtered.filter((question) => question.points === 200).length;
    const mediumCount = filtered.filter((question) => question.points === 400).length;
    const hardCount = filtered.filter((question) => question.points === 600).length;

    const availableGames = calculateAvailableGames(
      easyCount,
      mediumCount,
      hardCount
    );

    availabilityMap[category.id] = {
      availableGames,
      isSelectable: availableGames >= 1,
      mode,
      easyCount,
      mediumCount,
      hardCount,
    };
  }

  return availabilityMap;
}

async function fetchAllQuestionsPaged(
  supabase: ServerSupabase,
  categoryIds: string[]
) {
  if (categoryIds.length === 0) {
    return { data: [] as QuestionCandidate[], error: null };
  }

  let from = 0;
  const allRows: QuestionCandidate[] = [];

  while (true) {
    const { data, error } = await supabase
      .from("questions")
      .select("id, category_id, points, created_at")
      .in("category_id", categoryIds)
      .eq("is_active", true)
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      return { data: null as QuestionCandidate[] | null, error };
    }

    const rows = (data ?? []) as QuestionCandidate[];
    allRows.push(...rows);

    if (rows.length < PAGE_SIZE) {
      break;
    }

    from += PAGE_SIZE;
  }

  return { data: allRows, error: null };
}

async function fetchAllUserHistoryPaged(
  supabase: ServerSupabase,
  userId: string
) {
  let from = 0;
  const allRows: HistoryRow[] = [];

  while (true) {
    const { data, error } = await supabase
      .from("user_question_history")
      .select("question_id")
      .eq("user_id", userId)
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      return { data: null as HistoryRow[] | null, error };
    }

    const rows = (data ?? []) as HistoryRow[];
    allRows.push(...rows);

    if (rows.length < PAGE_SIZE) {
      break;
    }

    from += PAGE_SIZE;
  }

  return { data: allRows, error: null };
}

export default async function GameStartPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("games_remaining, account_tier, role")
    .eq("id", user.id)
    .single();

  const profile = profileData as ProfileForSession | null;

  if (!profile || (profile.games_remaining ?? 0) <= 0) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 text-center sm:p-10">
          <h1 className="text-2xl font-black sm:text-4xl">
            لا توجد ألعاب متبقية
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-lg">
            تم استهلاك عدد الألعاب المتاحة لحسابك. يمكنك الرجوع للرئيسية أو شحن
            حسابك للمتابعة.
          </p>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-cyan-400 px-6 py-3 font-bold text-slate-950 transition hover:bg-cyan-300"
            >
              الرجوع للرئيسية
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const [sectionsResult, categoriesResult] = await Promise.all([
    supabase
      .from("category_sections")
      .select("id, name, slug, description, sort_order, is_active")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("categories")
      .select("id, name, slug, description, image_url, section_id, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
  ]);

  const { data: sectionsData, error: sectionsError } = sectionsResult;
  const { data: categoriesData, error: categoriesError } = categoriesResult;

  if (sectionsError || categoriesError) {
    const message =
      sectionsError?.message ?? categoriesError?.message ?? "Unknown error";

    return (
      <main
        dir="rtl"
        className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-red-500/20 bg-red-500/10 p-6 text-center sm:p-10">
          <h1 className="text-2xl font-black sm:text-4xl">
            فشل تحميل بيانات الإعداد
          </h1>
          <p className="mt-4 text-sm leading-7 text-red-100 sm:text-lg">
            {message}
          </p>
        </div>
      </main>
    );
  }

  const sections: CategorySection[] = Array.isArray(sectionsData)
    ? (sectionsData as CategorySection[])
    : [];
  const categories: Category[] = Array.isArray(categoriesData)
    ? (categoriesData as Category[])
    : [];

  const selectionMode: "fixed" | "dynamic" =
    profile.role === "admin" ||
    profile.account_tier === "premium" ||
    (profile.games_remaining ?? 0) >= 2
      ? "dynamic"
      : "fixed";

  const {
    data: allQuestionsData,
    error: allQuestionsError,
  } = await fetchAllQuestionsPaged(
    supabase,
    categories.map((category) => category.id)
  );

  if (allQuestionsError) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-red-500/20 bg-red-500/10 p-6 text-center sm:p-10">
          <h1 className="text-2xl font-black sm:text-4xl">فشل تحميل الأسئلة</h1>
          <p className="mt-4 text-sm leading-7 text-red-100 sm:text-lg">
            {allQuestionsError.message}
          </p>
        </div>
      </main>
    );
  }

  const allQuestions = (allQuestionsData ?? []) as QuestionCandidate[];

  let usedQuestionIds = new Set<string>();

  if (selectionMode === "dynamic") {
    const {
      data: historyData,
      error: historyError,
    } = await fetchAllUserHistoryPaged(supabase, user.id);

    if (historyError) {
      return (
        <main
          dir="rtl"
          className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-3xl rounded-[2rem] border border-red-500/20 bg-red-500/10 p-6 text-center sm:p-10">
            <h1 className="text-2xl font-black sm:text-4xl">
              فشل تحميل سجل الأسئلة
            </h1>
            <p className="mt-4 text-sm leading-7 text-red-100 sm:text-lg">
              {historyError.message}
            </p>
          </div>
        </main>
      );
    }

    usedQuestionIds = new Set(
      (historyData ?? []).map((item) => String(item.question_id))
    );
  }

  const categoryAvailability = buildCategoryAvailability({
    categories,
    questions: allQuestions,
    usedQuestionIds,
    mode: selectionMode,
  });

  async function createGameSession(formData: FormData) {
    "use server";

    const supabase = await getSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const gameName = formData.get("gameName")?.toString().trim() || "";
    const teamOne = formData.get("teamOne")?.toString().trim() || "";
    const teamTwo = formData.get("teamTwo")?.toString().trim() || "";
    const selectedCategoriesRaw =
      formData.get("selectedCategories")?.toString().trim() || "";

    const selectedCategoryIds = selectedCategoriesRaw
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (!gameName || !teamOne || !teamTwo) {
      redirect(
        "/game/start?error=" +
          encodeURIComponent(
            "اسم اللعبة واسم الفريق الأول واسم الفريق الثاني مطلوبة."
          )
      );
    }

    if (selectedCategoryIds.length !== REQUIRED_CATEGORY_COUNT) {
      redirect(
        "/game/start?error=" +
          encodeURIComponent(`يجب اختيار ${REQUIRED_CATEGORY_COUNT} فئات بالضبط.`)
      );
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("games_remaining, account_tier, role")
      .eq("id", user.id)
      .single();

    const profile = profileData as ProfileForSession | null;

    if (!profile || (profile.games_remaining ?? 0) <= 0) {
      redirect(
        "/game/start?error=" + encodeURIComponent("لا توجد ألعاب متبقية")
      );
    }

    let effectiveTier = profile.account_tier ?? "free";

    if (effectiveTier !== "premium" && (profile.games_remaining ?? 0) >= 2) {
      const { error: promoteError } = await supabase
        .from("profiles")
        .update({ account_tier: "premium" })
        .eq("id", user.id);

      if (promoteError) {
        redirect(
          "/game/start?error=" +
            encodeURIComponent(promoteError.message || "فشل تحديث نوع الحساب")
        );
      }

      effectiveTier = "premium";
    }

    const shouldPreventRepeat =
      profile.role === "admin" || effectiveTier === "premium";

    const {
      data: allQuestionsData,
      error: questionsError,
    } = await fetchAllQuestionsPaged(supabase, selectedCategoryIds);

    if (questionsError) {
      redirect(
        "/game/start?error=" +
          encodeURIComponent(questionsError.message || "فشل تحميل الأسئلة")
      );
    }

    const allQuestions = (allQuestionsData ?? []) as QuestionCandidate[];
    let usedQuestionIds = new Set<string>();

    if (shouldPreventRepeat) {
      const {
        data: historyData,
        error: historyError,
      } = await fetchAllUserHistoryPaged(supabase, user.id);

      if (historyError) {
        redirect(
          "/game/start?error=" +
            encodeURIComponent(historyError.message || "فشل تحميل سجل الأسئلة")
        );
      }

      usedQuestionIds = new Set(
        (historyData ?? []).map((item) => String(item.question_id))
      );
    }

    const selectedCategories = categories.filter((category) =>
      selectedCategoryIds.includes(category.id)
    );

    const selectedAvailability = buildCategoryAvailability({
      categories: selectedCategories,
      questions: allQuestions,
      usedQuestionIds,
      mode: shouldPreventRepeat ? "dynamic" : "fixed",
    });

    const invalidCategory = selectedCategoryIds.find((categoryId) => {
      const availability = selectedAvailability[categoryId];
      return !availability || availability.availableGames < 1;
    });

    if (invalidCategory) {
      const categoryName =
        categories.find((item) => item.id === invalidCategory)?.name ??
        "فئة غير معروفة";

      redirect(
        "/game/start?error=" +
          encodeURIComponent(
            `الفئة "${categoryName}" لا تحتوي حاليًا على عدد كافٍ من الأسئلة لبدء لعبة كاملة.`
          )
      );
    }

    const built = buildSessionQuestions({
      selectedCategoryIds,
      allQuestions,
      usedQuestionIds,
      shouldRandomize: shouldPreventRepeat,
      categories,
    });

    if (built.error || built.rows.length === 0) {
      redirect(
        "/game/start?error=" +
          encodeURIComponent(built.error || "تعذر تجهيز أسئلة الجلسة")
      );
    }

    const initialBoardState = {
      teamOneScore: 0,
      teamTwoScore: 0,
      usedQuestionIds: [],
      openQuestionId: null,
      showAnswer: false,
      showWinnerPicker: false,
    };

    const { data: insertedSession, error: insertSessionError } = await supabase
      .from("game_sessions")
      .insert({
        user_id: user.id,
        game_name: gameName,
        team_one_name: teamOne,
        team_two_name: teamTwo,
        selected_category_ids: selectedCategoryIds,
        board_state: initialBoardState,
        status: "active",
      })
      .select("id")
      .single();

    if (insertSessionError || !insertedSession) {
      redirect(
        "/game/start?error=" +
          encodeURIComponent(insertSessionError?.message || "فشل إنشاء الجلسة")
      );
    }

    const sessionQuestionRows = built.rows.map((row) => ({
      session_id: insertedSession.id,
      category_id: row.category_id,
      question_id: row.question_id,
      points: row.points,
      slot_index: row.slot_index,
    }));

    const { error: sessionQuestionsError } = await supabase
      .from("game_session_questions")
      .insert(sessionQuestionRows);

    if (sessionQuestionsError) {
      await supabase.from("game_sessions").delete().eq("id", insertedSession.id);

      redirect(
        "/game/start?error=" +
          encodeURIComponent(
            sessionQuestionsError.message || "فشل حفظ أسئلة الجلسة"
          )
      );
    }

    const { error: decrementError } = await supabase
      .from("profiles")
      .update({
        games_remaining: Math.max((profile.games_remaining ?? 0) - 1, 0),
      })
      .eq("id", user.id);

    if (decrementError) {
      await supabase
        .from("game_session_questions")
        .delete()
        .eq("session_id", insertedSession.id);

      await supabase.from("game_sessions").delete().eq("id", insertedSession.id);

      redirect(
        "/game/start?error=" +
          encodeURIComponent(decrementError.message || "فشل خصم لعبة")
      );
    }

    redirect(`/game/board?sessionId=${insertedSession.id}`);
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6 lg:px-8 lg:py-10"
    >
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,#020617_0%,#07143a_50%,#020617_100%)] p-5 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-bold text-cyan-200 sm:text-sm">
                  إعداد لعبة جديدة
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 sm:text-sm">
                  اختر 6 فئات بالضبط
                </span>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-200 sm:text-sm">
                  {selectionMode === "dynamic"
                    ? "اسئلة بدون تكرار"
                    : "أسئلة ثابتة"}
                </span>
              </div>

              <h1 className="mt-4 text-3xl font-black sm:text-4xl">
                جهّز اللعبة خلال دقائق
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-8 text-slate-300 sm:text-base">
                اختر اسم اللعبة، أضف أسماء الفريقين، ثم حدّد ست فئات لتبدأ
                الجولة مباشرة.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:w-auto">
              <div className="rounded-[1.35rem] border border-white/10 bg-white/5 px-4 py-4 text-center">
                <p className="text-xs text-slate-400">الألعاب المتبقية</p>
                <p className="mt-2 text-2xl font-black text-white">
                  {profile.games_remaining ?? 0}
                </p>
              </div>
              <div className="rounded-[1.35rem] border border-white/10 bg-white/5 px-4 py-4 text-center">
                <p className="text-xs text-slate-400">الفئات المطلوبة</p>
                <p className="mt-2 text-2xl font-black text-white">
                  {REQUIRED_CATEGORY_COUNT}
                </p>
              </div>
            </div>
          </div>
        </div>

        {params.error ? (
          <div className="rounded-[1.5rem] border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-100 sm:text-base">
            {params.error}
          </div>
        ) : null}

        <StartGameForm
          sections={sections}
          categories={categories}
          gamesRemaining={profile.games_remaining ?? 0}
          action={createGameSession}
          categoryAvailability={categoryAvailability}
          selectionMode={selectionMode}
        />
      </div>
    </main>
  );
}