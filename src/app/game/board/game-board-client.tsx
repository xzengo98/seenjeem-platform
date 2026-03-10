"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

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

type Props = {
  sessionId: string;
  userId: string;
  initialBoardState: Record<string, unknown>;
  gameName: string;
  teamOne: string;
  teamTwo: string;
  categories: Category[];
  questions: QuestionRow[];
};

type OpenQuestion = QuestionRow & {
  categoryName: string;
  slotIndex: number;
};

type CategoryVisual = {
  emoji: string;
  gradient: string;
};

const categoryVisuals: Record<string, CategoryVisual> = {
  history: {
    emoji: "🏛️",
    gradient: "from-amber-300/20 via-orange-400/10 to-transparent",
  },
  sports: {
    emoji: "⚽",
    gradient: "from-emerald-300/20 via-green-400/10 to-transparent",
  },
  geography: {
    emoji: "🗺️",
    gradient: "from-sky-300/20 via-cyan-400/10 to-transparent",
  },
  science: {
    emoji: "🧪",
    gradient: "from-violet-300/20 via-fuchsia-400/10 to-transparent",
  },
  movies: {
    emoji: "🎬",
    gradient: "from-rose-300/20 via-pink-400/10 to-transparent",
  },
  islamic: {
    emoji: "🕌",
    gradient: "from-amber-200/20 via-yellow-400/10 to-transparent",
  },
  default: {
    emoji: "✨",
    gradient: "from-slate-300/20 via-slate-400/10 to-transparent",
  },
};

const MOBILE_CATEGORY_WIDTH = 150;
const MOBILE_SIDEBAR_WIDTH = 170;
const MOBILE_COLUMN_GAP = 12;
const MOBILE_BOARD_HEIGHT = 500;

export default function GameBoardClient({
  sessionId,
  userId,
  initialBoardState,
  gameName,
  teamOne,
  teamTwo,
  categories,
  questions,
}: Props) {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mobileWrapRef = useRef<HTMLDivElement | null>(null);

  const [teamOneScore, setTeamOneScore] = useState(
    Number(initialBoardState?.teamOneScore ?? 0)
  );
  const [teamTwoScore, setTeamTwoScore] = useState(
    Number(initialBoardState?.teamTwoScore ?? 0)
  );
  const [usedQuestionIds, setUsedQuestionIds] = useState<string[]>(
    Array.isArray(initialBoardState?.usedQuestionIds)
      ? (initialBoardState.usedQuestionIds as string[])
      : questions.filter((q) => q.is_used).map((q) => q.id)
  );
  const [openQuestion, setOpenQuestion] = useState<OpenQuestion | null>(null);
  const [showAnswer, setShowAnswer] = useState(
    Boolean(initialBoardState?.showAnswer ?? false)
  );
  const [showWinnerPicker, setShowWinnerPicker] = useState(
    Boolean(initialBoardState?.showWinnerPicker ?? false)
  );
  const [mobileScale, setMobileScale] = useState(1);
  const [mobileHeight, setMobileHeight] = useState(MOBILE_BOARD_HEIGHT);

  const grouped = useMemo(() => {
    const targetPattern = [200, 200, 400, 400, 600, 600];

    return categories.map((category) => {
      const categoryQuestions = questions
        .filter((question) => question.category_id === category.id)
        .sort((a, b) => {
          if (a.points !== b.points) return a.points - b.points;
          return a.question_text.localeCompare(b.question_text, "ar");
        });

      const slots = targetPattern.map((points, index) => {
        const matched = categoryQuestions.filter((q) => q.points === points);
        const samePointIndex =
          targetPattern.slice(0, index + 1).filter((value) => value === points)
            .length - 1;

        return {
          points,
          question: matched[samePointIndex] ?? null,
          slotIndex: index,
        };
      });

      return {
        ...category,
        rows: [
          [slots[0], slots[1]],
          [slots[2], slots[3]],
          [slots[4], slots[5]],
        ],
      };
    });
  }, [categories, questions]);

  useEffect(() => {
    const openQuestionId = initialBoardState?.openQuestionId;
    if (!openQuestionId || openQuestion) return;

    for (const category of grouped) {
      for (const row of category.rows) {
        for (const slot of row) {
          if (slot.question?.id === openQuestionId) {
            setOpenQuestion({
              ...slot.question,
              categoryName: category.name,
              slotIndex: slot.slotIndex,
            });
            return;
          }
        }
      }
    }
  }, [grouped, initialBoardState, openQuestion]);

  const playableQuestionIds = useMemo(() => {
    return grouped.flatMap((category) =>
      category.rows.flatMap((row) =>
        row
          .map((slot) => slot.question?.id ?? null)
          .filter((id): id is string => Boolean(id))
      )
    );
  }, [grouped]);

  useEffect(() => {
    if (playableQuestionIds.length === 0) return;

    const allUsed = playableQuestionIds.every((id) =>
      usedQuestionIds.includes(id)
    );

    if (allUsed && !openQuestion) {
      const params = new URLSearchParams({
        sessionId,
        gameName,
        teamOne,
        teamTwo,
        teamOneScore: String(teamOneScore),
        teamTwoScore: String(teamTwoScore),
      });

      router.push(`/game/result?${params.toString()}`);
    }
  }, [
    sessionId,
    gameName,
    teamOne,
    teamTwo,
    teamOneScore,
    teamTwoScore,
    usedQuestionIds,
    playableQuestionIds,
    openQuestion,
    router,
  ]);

  useEffect(() => {
    const boardState = {
      teamOneScore,
      teamTwoScore,
      usedQuestionIds,
      openQuestionId: openQuestion?.id ?? null,
      showAnswer,
      showWinnerPicker,
    };

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      await supabase.rpc("update_game_board_state", {
        p_session_id: sessionId,
        p_user_id: userId,
        p_board_state: boardState,
      });
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [
    supabase,
    sessionId,
    userId,
    teamOneScore,
    teamTwoScore,
    usedQuestionIds,
    openQuestion,
    showAnswer,
    showWinnerPicker,
  ]);

  useEffect(() => {
    function updateMobileBoardScale() {
      if (window.innerWidth >= 768) return;

      const categoriesCount = Math.max(grouped.length, 1);
      const baseWidth =
        categoriesCount * MOBILE_CATEGORY_WIDTH +
        MOBILE_SIDEBAR_WIDTH +
        (categoriesCount + 1) * MOBILE_COLUMN_GAP +
        24;

      const wrapWidth = mobileWrapRef.current?.clientWidth ?? window.innerWidth;
      const availableWidth = Math.max(wrapWidth - 4, 200);

      const viewportHeight =
        window.visualViewport?.height ?? window.innerHeight ?? 700;
      const availableHeight = Math.max(viewportHeight - 180, 240);

      const scaleByWidth = availableWidth / baseWidth;
      const scaleByHeight = availableHeight / MOBILE_BOARD_HEIGHT;
      const nextScale = Math.min(scaleByWidth, scaleByHeight, 1);

      setMobileScale(nextScale);
      setMobileHeight(MOBILE_BOARD_HEIGHT * nextScale);
    }

    updateMobileBoardScale();

    const resizeHandler = () => updateMobileBoardScale();

    window.addEventListener("resize", resizeHandler);
    window.addEventListener("orientationchange", resizeHandler);

    let resizeObserver: ResizeObserver | null = null;
    if (mobileWrapRef.current && typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => updateMobileBoardScale());
      resizeObserver.observe(mobileWrapRef.current);
    }

    return () => {
      window.removeEventListener("resize", resizeHandler);
      window.removeEventListener("orientationchange", resizeHandler);
      resizeObserver?.disconnect();
    };
  }, [grouped.length]);

  function openQuestionCard(
    question: QuestionRow,
    categoryName: string,
    slotIndex: number
  ) {
    if (usedQuestionIds.includes(question.id)) return;
    setOpenQuestion({ ...question, categoryName, slotIndex });
    setShowAnswer(false);
    setShowWinnerPicker(false);
  }

  function closeModal() {
    setOpenQuestion(null);
    setShowAnswer(false);
    setShowWinnerPicker(false);
  }

  function revealAnswer() {
    setShowAnswer(true);
  }

  function goToWinnerPicker() {
    setShowWinnerPicker(true);
  }

  function awardPoints(winner: "teamOne" | "teamTwo" | "none") {
    if (!openQuestion) return;

    if (winner === "teamOne") {
      setTeamOneScore((prev) => prev + openQuestion.points);
    } else if (winner === "teamTwo") {
      setTeamTwoScore((prev) => prev + openQuestion.points);
    }

    setUsedQuestionIds((prev) => [...prev, openQuestion.id]);
    closeModal();
  }

  function increaseTeamOneScore() {
    setTeamOneScore((prev) => prev + 100);
  }

  function decreaseTeamOneScore() {
    setTeamOneScore((prev) => Math.max(prev - 100, 0));
  }

  function increaseTeamTwoScore() {
    setTeamTwoScore((prev) => prev + 100);
  }

  function decreaseTeamTwoScore() {
    setTeamTwoScore((prev) => Math.max(prev - 100, 0));
  }

  const leadingTeam =
    teamOneScore > teamTwoScore
      ? "teamOne"
      : teamTwoScore > teamOneScore
      ? "teamTwo"
      : "tie";

  const mobileBoardWidth =
    Math.max(grouped.length, 1) * MOBILE_CATEGORY_WIDTH +
    MOBILE_SIDEBAR_WIDTH +
    (Math.max(grouped.length, 1) + 1) * MOBILE_COLUMN_GAP +
    24;

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-950 text-white">
      <div className="border-b border-white/10 bg-gradient-to-l from-white/10 via-white/5 to-transparent px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4">
        <div className="mx-auto flex max-w-[1700px] items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link
              href="/game/start"
              className="rounded-2xl border border-white/10 px-3 py-2 text-[11px] font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white md:hidden"
            >
              لعبة جديدة
            </Link>
          </div>

          <div className="text-center">
            <div className="text-[10px] text-slate-400 sm:text-xs">اسم اللعبة</div>
            <div className="text-base font-black sm:text-lg md:text-3xl">
              {gameName}
            </div>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/game/start"
              className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              لعبة جديدة
            </Link>
            <Link
              href="/"
              className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              الخروج
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-3 flex max-w-[1700px] justify-center">
          <div className="rounded-full bg-orange-400 px-4 py-2 text-center text-[11px] font-black text-slate-950 sm:px-6 sm:text-sm md:px-8 md:py-3 md:text-xl">
            الحكم هو من يحدد الفريق الصحيح
          </div>
        </div>
      </div>

      <div className="block px-2 py-3 md:hidden">
        <div
          ref={mobileWrapRef}
          className="mx-auto w-full"
          style={{ height: mobileHeight }}
        >
          <div
            className="mx-auto rounded-[24px] border border-white/10 bg-slate-950/80 p-3"
            style={{
              width: mobileBoardWidth,
              height: MOBILE_BOARD_HEIGHT,
              transform: `scale(${mobileScale})`,
              transformOrigin: "top center",
            }}
          >
            <BoardContent
              compact
              gameName={gameName}
              teamOne={teamOne}
              teamTwo={teamTwo}
              teamOneScore={teamOneScore}
              teamTwoScore={teamTwoScore}
              leadingTeam={leadingTeam}
              grouped={grouped}
              usedQuestionIds={usedQuestionIds}
              onOpenQuestion={openQuestionCard}
              onIncTeamOne={increaseTeamOneScore}
              onDecTeamOne={decreaseTeamOneScore}
              onIncTeamTwo={increaseTeamTwoScore}
              onDecTeamTwo={decreaseTeamTwoScore}
            />
          </div>
        </div>
      </div>

      <div className="hidden px-4 py-5 md:block md:px-6">
        <div className="mx-auto max-w-[1700px] rounded-[2rem] border border-white/10 bg-slate-950/70 p-5 xl:p-6">
          <BoardContent
            gameName={gameName}
            teamOne={teamOne}
            teamTwo={teamTwo}
            teamOneScore={teamOneScore}
            teamTwoScore={teamTwoScore}
            leadingTeam={leadingTeam}
            grouped={grouped}
            usedQuestionIds={usedQuestionIds}
            onOpenQuestion={openQuestionCard}
            onIncTeamOne={increaseTeamOneScore}
            onDecTeamOne={decreaseTeamOneScore}
            onIncTeamTwo={increaseTeamTwoScore}
            onDecTeamTwo={decreaseTeamTwoScore}
          />
        </div>
      </div>

      {openQuestion ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 px-3 py-4 md:px-4 md:py-6">
          <div className="w-full max-w-7xl rounded-[1.5rem] border border-orange-400/40 bg-[#2e2f33] p-4 shadow-2xl md:rounded-[2.5rem] md:p-8">
            {!showAnswer && !showWinnerPicker ? (
              <div className="space-y-5 md:space-y-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="rounded-full bg-orange-400 px-3 py-2 text-xs font-bold text-slate-950 md:px-4 md:text-sm">
                    {openQuestion.points} نقطة
                  </div>
                  <div className="rounded-full bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200 md:px-4 md:text-sm">
                    {openQuestion.categoryName}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-orange-400/40 bg-[#35363a] px-4 py-6 text-center md:rounded-[2rem] md:px-6 md:py-10">
                  <h2 className="text-xl font-black leading-[1.8] sm:text-2xl md:text-5xl md:leading-[1.7]">
                    {openQuestion.question_text}
                  </h2>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between md:gap-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-300 md:px-6"
                  >
                    إغلاق
                  </button>

                  <button
                    type="button"
                    onClick={revealAnswer}
                    className="rounded-2xl bg-green-600 px-6 py-3 text-lg font-black text-white md:px-8 md:py-4 md:text-2xl"
                  >
                    الإجابة
                  </button>
                </div>
              </div>
            ) : showAnswer && !showWinnerPicker ? (
              <div className="space-y-5 md:space-y-8">
                <div className="rounded-[1.5rem] border border-orange-400/40 bg-[#35363a] px-4 py-6 text-center md:rounded-[2rem] md:px-6 md:py-10">
                  <div className="text-sm text-slate-300 md:text-lg">الإجابة الصحيحة</div>
                  <h2 className="mt-4 text-2xl font-black leading-[1.7] sm:text-3xl md:mt-6 md:text-6xl md:leading-[1.5]">
                    {openQuestion.answer_text ?? "لا توجد إجابة"}
                  </h2>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between md:gap-4">
                  <button
                    type="button"
                    onClick={() => setShowAnswer(false)}
                    className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-300 md:px-6"
                  >
                    ارجع للسؤال
                  </button>

                  <button
                    type="button"
                    onClick={goToWinnerPicker}
                    className="rounded-2xl bg-red-600 px-6 py-3 text-lg font-black text-white md:px-8 md:py-4 md:text-2xl"
                  >
                    أي فريق؟
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6 text-center md:space-y-10">
                <h2 className="text-2xl font-black md:text-6xl">أي فريق جاوب صح؟</h2>

                <div className="grid gap-3 md:grid-cols-3 md:gap-6">
                  <button
                    type="button"
                    onClick={() => awardPoints("teamOne")}
                    className="rounded-[1.5rem] bg-red-600 px-5 py-5 text-2xl font-black text-white md:rounded-[2rem] md:px-8 md:py-8 md:text-4xl"
                  >
                    {teamOne}
                  </button>

                  <button
                    type="button"
                    onClick={() => awardPoints("teamTwo")}
                    className="rounded-[1.5rem] bg-red-600 px-5 py-5 text-2xl font-black text-white md:rounded-[2rem] md:px-8 md:py-8 md:text-4xl"
                  >
                    {teamTwo}
                  </button>

                  <button
                    type="button"
                    onClick={() => awardPoints("none")}
                    className="rounded-[1.5rem] bg-slate-500 px-5 py-5 text-2xl font-black text-white md:rounded-[2rem] md:px-8 md:py-8 md:text-4xl"
                  >
                    ولا أحد
                  </button>
                </div>

                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setShowWinnerPicker(false)}
                    className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-300 md:px-6"
                  >
                    العودة للإجابة
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </main>
  );
}

function BoardContent({
  gameName,
  teamOne,
  teamTwo,
  teamOneScore,
  teamTwoScore,
  leadingTeam,
  grouped,
  usedQuestionIds,
  onOpenQuestion,
  onIncTeamOne,
  onDecTeamOne,
  onIncTeamTwo,
  onDecTeamTwo,
  compact = false,
}: {
  gameName: string;
  teamOne: string;
  teamTwo: string;
  teamOneScore: number;
  teamTwoScore: number;
  leadingTeam: "teamOne" | "teamTwo" | "tie";
  grouped: Array<{
    id: string;
    name: string;
    slug: string;
    image_url: string | null;
    rows: Array<
      Array<{
        points: number;
        question: QuestionRow | null;
        slotIndex: number;
      }>
    >;
  }>;
  usedQuestionIds: string[];
  onOpenQuestion: (
    question: QuestionRow,
    categoryName: string,
    slotIndex: number
  ) => void;
  onIncTeamOne: () => void;
  onDecTeamOne: () => void;
  onIncTeamTwo: () => void;
  onDecTeamTwo: () => void;
  compact?: boolean;
}) {
  const categoryCount = Math.max(grouped.length, 1);

  const sidebarWidth = compact ? 170 : 250;
  const gap = compact ? 12 : 16;
  const columns = `repeat(${categoryCount}, minmax(0, 1fr)) ${sidebarWidth}px`;

  return (
    <div className="h-full w-full" dir="ltr">
      <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2">
        <div className={`font-black text-cyan-400 ${compact ? "text-4xl" : "text-5xl"}`}>
          SeenJeem
        </div>
        <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-1 text-sm font-black text-cyan-300">
          لعبة
        </div>
      </div>

      <div
        className="grid items-start"
        style={{
          gridTemplateColumns: columns,
          gap: `${gap}px`,
        }}
      >
        {grouped.map((category) => (
          <BoardCategoryColumn
            key={category.id}
            category={category}
            usedQuestionIds={usedQuestionIds}
            onOpenQuestion={onOpenQuestion}
            compact={compact}
          />
        ))}

        <div className="flex flex-col gap-3" dir="rtl">
          <SideTeamCard
            compact={compact}
            name={teamOne}
            score={teamOneScore}
            accent="cyan"
            isLeading={leadingTeam === "teamOne"}
            onIncrease={onIncTeamOne}
            onDecrease={onDecTeamOne}
          />

          <SideTeamCard
            compact={compact}
            name={teamTwo}
            score={teamTwoScore}
            accent="orange"
            isLeading={leadingTeam === "teamTwo"}
            onIncrease={onIncTeamTwo}
            onDecrease={onDecTeamTwo}
          />

          <div
            className={`rounded-2xl border border-white/10 bg-white/5 px-3 text-center font-bold text-slate-300 ${
              compact ? "py-3 text-sm" : "py-4 text-base"
            }`}
          >
            {leadingTeam === "tie"
              ? "لا يوجد متصدر حاليًا"
              : `المتصدر الآن: ${
                  leadingTeam === "teamOne" ? teamOne : teamTwo
                }`}
          </div>

          {!compact ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-center">
              <div className="text-sm text-slate-400">الجولة الحالية</div>
              <div className="mt-2 text-2xl font-black text-cyan-300">
                {gameName}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function BoardCategoryColumn({
  category,
  usedQuestionIds,
  onOpenQuestion,
  compact,
}: {
  category: {
    id: string;
    name: string;
    slug: string;
    image_url: string | null;
    rows: Array<
      Array<{
        points: number;
        question: QuestionRow | null;
        slotIndex: number;
      }>
    >;
  };
  usedQuestionIds: string[];
  onOpenQuestion: (
    question: QuestionRow,
    categoryName: string,
    slotIndex: number
  ) => void;
  compact: boolean;
}) {
  const visual = categoryVisuals[category.slug] ?? categoryVisuals.default;

  return (
    <div className="flex flex-col gap-2" dir="rtl">
      <div
        className={`overflow-hidden border border-white/10 bg-slate-900/70 ${
          compact ? "rounded-[18px]" : "rounded-[22px]"
        }`}
      >
        <div
          className={`relative bg-gradient-to-br ${visual.gradient} ${
            compact ? "h-[126px]" : "h-[180px]"
          }`}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_30%)]" />

          <div className="relative flex h-full items-center justify-center px-3">
            {category.image_url ? (
              <div
                className={`relative ${
                  compact ? "h-[70px] w-[70px]" : "h-[110px] w-[110px]"
                }`}
              >
                <Image
                  src={category.image_url}
                  alt={category.name}
                  fill
                  className="object-contain drop-shadow-[0_12px_30px_rgba(0,0,0,0.35)]"
                />
              </div>
            ) : (
              <div className={compact ? "text-5xl" : "text-7xl"}>
                {visual.emoji}
              </div>
            )}
          </div>

          <div
            className={`absolute inset-x-0 bottom-0 border-t border-white/10 bg-slate-950/80 px-2 text-center ${
              compact ? "py-2" : "py-3"
            }`}
          >
            <div
              className={`line-clamp-2 font-black ${
                compact ? "text-[18px] leading-6" : "text-[24px] leading-8"
              }`}
            >
              {category.name}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-2">
        {category.rows.map((row, rowIndex) => (
          <div key={`${category.id}-${rowIndex}`} className="grid grid-cols-2 gap-2">
            {row.map((slot) => (
              <BoardPointsButton
                key={`${category.id}-${slot.slotIndex}`}
                compact={compact}
                slot={slot}
                usedQuestionIds={usedQuestionIds}
                categoryName={category.name}
                onOpenQuestion={onOpenQuestion}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function BoardPointsButton({
  slot,
  usedQuestionIds,
  categoryName,
  onOpenQuestion,
  compact,
}: {
  slot: {
    points: number;
    question: QuestionRow | null;
    slotIndex: number;
  };
  usedQuestionIds: string[];
  categoryName: string;
  onOpenQuestion: (
    question: QuestionRow,
    categoryName: string,
    slotIndex: number
  ) => void;
  compact: boolean;
}) {
  const question = slot.question;
  const used = question ? usedQuestionIds.includes(question.id) : true;

  return (
    <button
      type="button"
      disabled={!question || used}
      onClick={() =>
        question && onOpenQuestion(question, categoryName, slot.slotIndex)
      }
      className={`font-black transition ${
        compact
          ? "h-[48px] rounded-[14px] text-[22px]"
          : "h-[64px] rounded-[18px] text-[28px]"
      } ${
        !question
          ? "cursor-not-allowed border border-white/5 bg-slate-900/30 text-slate-700"
          : used
          ? "cursor-not-allowed border border-white/10 bg-slate-900/60 text-slate-500 line-through"
          : "border border-white/10 bg-[#151922] text-white hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-cyan-300"
      }`}
    >
      {slot.points}
    </button>
  );
}

function SideTeamCard({
  name,
  score,
  accent,
  isLeading,
  onIncrease,
  onDecrease,
  compact,
}: {
  name: string;
  score: number;
  accent: "cyan" | "orange";
  isLeading: boolean;
  onIncrease: () => void;
  onDecrease: () => void;
  compact: boolean;
}) {
  const theme =
    accent === "cyan"
      ? {
          badge: "bg-cyan-400 text-slate-950",
          wrapper: isLeading
            ? "border-cyan-300/40 bg-cyan-400/10 shadow-[0_0_28px_rgba(34,211,238,0.14)]"
            : "border-white/10 bg-white/5",
          action:
            "border-cyan-400/30 bg-cyan-400/10 text-cyan-300 hover:bg-cyan-400/20",
        }
      : {
          badge: "bg-orange-400 text-slate-950",
          wrapper: isLeading
            ? "border-orange-300/40 bg-orange-400/10 shadow-[0_0_28px_rgba(251,146,60,0.14)]"
            : "border-white/10 bg-white/5",
          action:
            "border-orange-400/30 bg-orange-400/10 text-orange-300 hover:bg-orange-400/20",
        };

  return (
    <div
      className={`rounded-[18px] border ${theme.wrapper} ${
        compact ? "p-3" : "p-4"
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div
          className={`rounded-xl font-black ${theme.badge} ${
            compact ? "px-3 py-1.5 text-sm" : "px-4 py-2 text-base"
          }`}
        >
          {name}
        </div>

        {isLeading ? (
          <div className="rounded-full border border-amber-300/30 bg-amber-400/10 px-2 py-1 text-[10px] font-bold text-amber-200">
            متصدر
          </div>
        ) : (
          <div className="h-[22px]" />
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onIncrease}
          className={`flex items-center justify-center rounded-full border font-black transition ${theme.action} ${
            compact ? "h-9 w-9 text-xl" : "h-11 w-11 text-2xl"
          }`}
        >
          +
        </button>

        <div
          className={`rounded-2xl border border-white/10 bg-slate-900/70 text-center ${
            compact ? "min-w-[64px] px-3 py-2" : "min-w-[92px] px-5 py-3"
          }`}
        >
          <div className={compact ? "text-4xl font-black" : "text-5xl font-black"}>
            {score}
          </div>
        </div>

        <button
          type="button"
          onClick={onDecrease}
          className={`flex items-center justify-center rounded-full border font-black transition ${theme.action} ${
            compact ? "h-9 w-9 text-xl" : "h-11 w-11 text-2xl"
          }`}
        >
          −
        </button>
      </div>

      <div className={`mt-2 text-center text-slate-400 ${compact ? "text-xs" : "text-sm"}`}>
        نقطة
      </div>
    </div>
  );
}