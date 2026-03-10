"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
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
  year_tolerance_before?: number | null;
  year_tolerance_after?: number | null;
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

type GroupedCategory = Category & {
  rows: Array<
    Array<{
      points: number;
      question: QuestionRow | null;
      slotIndex: number;
    }>
  >;
};

const categoryVisuals: Record<string, CategoryVisual> = {
  history: {
    emoji: "🏺",
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
const QUESTION_TIMER_SECONDS = 30;

function formatCountdown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

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
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
  const [modalBusy, setModalBusy] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIMER_SECONDS);
  const [timerRunning, setTimerRunning] = useState(false);
  const [mobileScale, setMobileScale] = useState(1);
  const [mobileHeight, setMobileHeight] = useState(MOBILE_BOARD_HEIGHT);

  const grouped = useMemo<GroupedCategory[]>(() => {
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
          targetPattern
            .slice(0, index + 1)
            .filter((value) => value === points).length - 1;

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

            if (
              !Boolean(initialBoardState?.showAnswer ?? false) &&
              !Boolean(initialBoardState?.showWinnerPicker ?? false)
            ) {
              setTimeLeft(QUESTION_TIMER_SECONDS);
              setTimerRunning(true);
            }

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

    const allUsed = playableQuestionIds.every((id) => usedQuestionIds.includes(id));

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

    saveTimeoutRef.current = setTimeout(() => {
      void supabase.rpc("update_game_board_state", {
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
      const boardWidth =
        categoriesCount * MOBILE_CATEGORY_WIDTH +
        MOBILE_SIDEBAR_WIDTH +
        (categoriesCount + 1) * MOBILE_COLUMN_GAP +
        24;

      const wrapWidth = mobileWrapRef.current?.clientWidth ?? window.innerWidth;
      const availableWidth = Math.max(wrapWidth - 4, 220);

      const viewportHeight = window.visualViewport?.height ?? window.innerHeight ?? 700;
      const reservedTop = 145;
      const availableHeight = Math.max(viewportHeight - reservedTop, 220);

      const scaleByWidth = availableWidth / boardWidth;
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

  useEffect(() => {
    if (!openQuestion || showAnswer || showWinnerPicker || !timerRunning) {
      return;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          setTimerRunning(false);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [openQuestion, showAnswer, showWinnerPicker, timerRunning]);

  function openQuestionCard(
    question: QuestionRow,
    categoryName: string,
    slotIndex: number
  ) {
    if (usedQuestionIds.includes(question.id) || modalBusy) return;

    setOpenQuestion({ ...question, categoryName, slotIndex });
    setShowAnswer(false);
    setShowWinnerPicker(false);
    setTimeLeft(QUESTION_TIMER_SECONDS);
    setTimerRunning(true);
  }

  function closeModal() {
    if (modalBusy) return;
    setModalBusy(true);

    setOpenQuestion(null);
    setShowAnswer(false);
    setShowWinnerPicker(false);
    setTimerRunning(false);
    setTimeLeft(QUESTION_TIMER_SECONDS);

    setTimeout(() => {
      setModalBusy(false);
    }, 180);
  }

  function revealAnswer() {
    if (modalBusy || !openQuestion) return;
    setModalBusy(true);

    setShowAnswer(true);
    setShowWinnerPicker(false);
    setTimerRunning(false);

    setTimeout(() => {
      setModalBusy(false);
    }, 180);
  }

  function goToWinnerPicker() {
    if (modalBusy || !openQuestion) return;
    setModalBusy(true);

    setShowWinnerPicker(true);
    setTimerRunning(false);

    setTimeout(() => {
      setModalBusy(false);
    }, 180);
  }

  function backToQuestion() {
    if (modalBusy || !openQuestion) return;
    setModalBusy(true);

    setShowAnswer(false);
    setShowWinnerPicker(false);
    setTimeLeft(QUESTION_TIMER_SECONDS);
    setTimerRunning(true);

    setTimeout(() => {
      setModalBusy(false);
    }, 180);
  }

  function backToAnswer() {
    if (modalBusy || !openQuestion) return;
    setModalBusy(true);

    setShowWinnerPicker(false);
    setShowAnswer(true);
    setTimerRunning(false);

    setTimeout(() => {
      setModalBusy(false);
    }, 180);
  }

  function awardPoints(winner: "teamOne" | "teamTwo" | "none") {
    if (!openQuestion || modalBusy) return;
    setModalBusy(true);

    if (winner === "teamOne") {
      setTeamOneScore((prev) => prev + openQuestion.points);
    } else if (winner === "teamTwo") {
      setTeamTwoScore((prev) => prev + openQuestion.points);
    }

    setUsedQuestionIds((prev) => [...prev, openQuestion.id]);
    setOpenQuestion(null);
    setShowAnswer(false);
    setShowWinnerPicker(false);
    setTimerRunning(false);
    setTimeLeft(QUESTION_TIMER_SECONDS);

    setTimeout(() => {
      setModalBusy(false);
    }, 220);
  }

  function toggleTimer() {
    if (!openQuestion || showAnswer || showWinnerPicker) return;
    setTimerRunning((prev) => !prev);
  }

  function resetTimer() {
    if (!openQuestion) return;
    setTimeLeft(QUESTION_TIMER_SECONDS);
    setTimerRunning(!showAnswer && !showWinnerPicker);
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
    <main dir="rtl" className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-[1700px] flex-col px-3 py-3 md:px-5 md:py-5">
        <header className="mb-3 rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-4 py-3 md:mb-5 md:rounded-[2rem] md:px-6 md:py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs text-cyan-300 md:text-sm">SeenJeem</p>
              <h1 className="mt-1 text-lg font-black md:text-2xl">{gameName}</h1>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/game/start"
                className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-bold text-cyan-200 transition hover:bg-cyan-400/20"
              >
                لعبة جديدة
              </Link>
              <Link
                href="/account"
                className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10"
              >
                الخروج
              </Link>
            </div>
          </div>
        </header>

        <div className="mb-3 rounded-[1.25rem] border border-orange-400/20 bg-orange-400/10 px-4 py-3 text-center text-sm text-orange-50 md:mb-5 md:text-base">
          الحكم هو من يحدد الفريق الصحيح
        </div>

        <div className="hidden md:block">
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

        <div ref={mobileWrapRef} className="md:hidden">
          <div
            className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.03]"
            style={{ height: mobileHeight }}
          >
            <div
              style={{
                width: mobileBoardWidth,
                transform: `scale(${mobileScale})`,
                transformOrigin: "top right",
              }}
            >
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
                compact
              />
            </div>
          </div>
        </div>
      </div>

      {openQuestion ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-3 backdrop-blur-sm md:p-8">
          <div className="relative w-full max-w-7xl rounded-[1.5rem] border border-orange-400/40 bg-[#2e2f33] p-4 pt-16 shadow-2xl md:rounded-[2.5rem] md:p-8 md:pt-20">
            <QuestionTimerBar
              visible={!showAnswer && !showWinnerPicker}
              timeLabel={formatCountdown(timeLeft)}
              isRunning={timerRunning}
              onToggle={toggleTimer}
              onReset={resetTimer}
            />

            {!showAnswer && !showWinnerPicker ? (
              <div className="space-y-5 md:space-y-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="rounded-2xl bg-black px-4 py-2 text-sm font-black text-white md:px-5 md:py-3 md:text-2xl">
                    {openQuestion.points} نقطة
                  </div>

                  <div className="rounded-2xl bg-orange-500 px-4 py-2 text-sm font-black text-white md:px-5 md:py-3 md:text-2xl">
                    {openQuestion.categoryName}
                  </div>
                </div>

                {(openQuestion.year_tolerance_before ||
                  openQuestion.year_tolerance_after) && (
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm text-slate-200 md:text-lg">
                    السماحية: قبل {openQuestion.year_tolerance_before ?? 0} / بعد{" "}
                    {openQuestion.year_tolerance_after ?? 0} سنة
                  </div>
                )}

                <div className="rounded-[1.5rem] border border-orange-400/50 bg-white/[0.03] p-4 md:rounded-[2rem] md:p-8">
                  <RichHtmlContent html={openQuestion.question_text} />
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={modalBusy}
                    className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-base font-bold text-white transition hover:bg-white/10 disabled:opacity-50"
                  >
                    إغلاق
                  </button>

                  <button
                    type="button"
                    onClick={revealAnswer}
                    disabled={modalBusy}
                    className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-green-600 px-6 py-3 text-base font-black text-white transition hover:bg-green-500 disabled:opacity-50"
                  >
                    الإجابة
                  </button>
                </div>
              </div>
            ) : showAnswer && !showWinnerPicker ? (
              <div className="space-y-5 md:space-y-8">
                {(openQuestion.year_tolerance_before ||
                  openQuestion.year_tolerance_after) && (
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm text-slate-200 md:text-lg">
                    السماحية المقبولة: قبل {openQuestion.year_tolerance_before ?? 0} / بعد{" "}
                    {openQuestion.year_tolerance_after ?? 0} سنة
                  </div>
                )}

                <div className="rounded-[1.5rem] border border-emerald-400/40 bg-emerald-500/10 p-4 text-center md:rounded-[2rem] md:p-6">
                  <h2 className="text-2xl font-black text-white md:text-4xl">
                    الإجابة الصحيحة
                  </h2>
                </div>

                <div className="rounded-[1.5rem] border border-emerald-400/40 bg-white/[0.03] p-4 md:rounded-[2rem] md:p-8">
                  <RichHtmlContent
                    html={
                      openQuestion.answer_text?.trim() ||
                      "<p>لا توجد إجابة محفوظة لهذا السؤال.</p>"
                    }
                  />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                  <button
                    type="button"
                    onClick={backToQuestion}
                    disabled={modalBusy}
                    className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-base font-bold text-white transition hover:bg-white/10 disabled:opacity-50"
                  >
                    ارجع للسؤال
                  </button>

                  <button
                    type="button"
                    onClick={goToWinnerPicker}
                    disabled={modalBusy}
                    className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-orange-500 px-6 py-3 text-base font-black text-white transition hover:bg-orange-400 disabled:opacity-50"
                  >
                    أي فريق؟
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-5 md:space-y-8">
                <div className="text-center">
                  <h2 className="text-3xl font-black text-white md:text-5xl">
                    أي فريق جاوب صح؟
                  </h2>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => awardPoints("teamOne")}
                    disabled={modalBusy}
                    className="rounded-[1.5rem] bg-red-600 px-5 py-5 text-2xl font-black text-white transition hover:bg-red-500 disabled:opacity-50 md:rounded-[2rem] md:px-8 md:py-8 md:text-4xl"
                  >
                    {teamOne}
                  </button>

                  <button
                    type="button"
                    onClick={() => awardPoints("teamTwo")}
                    disabled={modalBusy}
                    className="rounded-[1.5rem] bg-red-600 px-5 py-5 text-2xl font-black text-white transition hover:bg-red-500 disabled:opacity-50 md:rounded-[2rem] md:px-8 md:py-8 md:text-4xl"
                  >
                    {teamTwo}
                  </button>

                  <button
                    type="button"
                    onClick={() => awardPoints("none")}
                    disabled={modalBusy}
                    className="rounded-[1.5rem] bg-slate-500 px-5 py-5 text-2xl font-black text-white transition hover:bg-slate-400 disabled:opacity-50 md:rounded-[2rem] md:px-8 md:py-8 md:text-4xl"
                  >
                    ولا أحد
                  </button>
                </div>

                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={backToAnswer}
                    disabled={modalBusy}
                    className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-base font-bold text-white transition hover:bg-white/10 disabled:opacity-50"
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
  grouped: GroupedCategory[];
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
  const sidebarWidth = compact ? MOBILE_SIDEBAR_WIDTH : 250;
  const gap = compact ? MOBILE_COLUMN_GAP : 16;

  const columns =
    categoryCount > 0
      ? compact
        ? `repeat(${categoryCount}, ${MOBILE_CATEGORY_WIDTH}px) ${sidebarWidth}px`
        : `repeat(${categoryCount}, minmax(0, 1fr)) ${sidebarWidth}px`
      : `${sidebarWidth}px`;

  return (
    <div
      className={`rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 ${
        compact ? "p-3" : "p-4 md:rounded-[2.25rem] md:p-5"
      }`}
    >
      <div
        className={`mb-3 flex items-center justify-between ${compact ? "text-xs" : "text-sm md:mb-4"}`}
      >
        <div className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-cyan-200">
          SeenJeem
        </div>
        {!compact ? (
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-300">
            لعبة
          </div>
        ) : null}
      </div>

      <div
        className="grid items-start"
        style={{
          gap,
          gridTemplateColumns: columns,
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

        {grouped.length === 0 ? (
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-center text-slate-300">
            لا توجد فئات أو أسئلة جاهزة لهذه الجلسة.
          </div>
        ) : null}

        <div
          className={`rounded-[1.5rem] border border-white/10 bg-white/[0.04] ${
            compact ? "p-3" : "p-4 md:rounded-[2rem] md:p-5"
          }`}
        >
          <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-3 text-center">
            <p className={`${compact ? "text-[11px]" : "text-sm"} text-slate-400`}>
              {leadingTeam === "tie"
                ? "لا يوجد متصدر حاليًا"
                : `المتصدر الآن: ${
                    leadingTeam === "teamOne" ? teamOne : teamTwo
                  }`}
            </p>
          </div>

          {!compact ? (
            <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-white/5 p-4 text-center">
              <p className="text-sm text-slate-400">الجولة الحالية</p>
              <p className="mt-2 text-2xl font-black text-white">{gameName}</p>
            </div>
          ) : null}

          <div className="mt-4 space-y-3">
            <ScoreCard
              compact={compact}
              title={teamOne}
              score={teamOneScore}
              highlighted={leadingTeam === "teamOne"}
              onIncrease={onIncTeamOne}
              onDecrease={onDecTeamOne}
            />

            <ScoreCard
              compact={compact}
              title={teamTwo}
              score={teamTwoScore}
              highlighted={leadingTeam === "teamTwo"}
              onIncrease={onIncTeamTwo}
              onDecrease={onDecTeamTwo}
            />
          </div>
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
  category: GroupedCategory;
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
    <div
      className={`overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.04] ${
        compact ? "w-[150px]" : ""
      }`}
    >
      <div className={`relative bg-slate-900 ${compact ? "p-2.5" : "p-3 md:p-4"}`}>
        <div
          className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${visual.gradient}`}
        />

        <div className="relative">
          <div
            className={`mb-3 overflow-hidden rounded-[1.1rem] border border-white/10 bg-white/5 ${
              compact ? "aspect-[1.2/1]" : "aspect-[1.4/1]"
            }`}
          >
            {category.image_url ? (
              <img
                src={category.image_url}
                alt={category.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-4xl">
                {visual.emoji}
              </div>
            )}
          </div>

          <div className="rounded-[1rem] bg-black/30 px-3 py-2 text-center">
            <p
              className={`font-black text-white ${
                compact ? "text-sm leading-5" : "text-lg md:text-xl"
              }`}
            >
              {category.name}
            </p>
          </div>
        </div>
      </div>

      <div className={`${compact ? "p-2" : "p-3 md:p-4"}`}>
        <div className="space-y-2.5">
          {category.rows.map((row, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-2 gap-2.5">
              {row.map((slot) => {
                const used = slot.question
                  ? usedQuestionIds.includes(slot.question.id)
                  : true;

                return (
                  <QuestionTile
                    key={`${category.id}-${slot.slotIndex}`}
                    compact={compact}
                    points={slot.points}
                    disabled={!slot.question || used}
                    onClick={() => {
                      if (!slot.question) return;
                      onOpenQuestion(slot.question, category.name, slot.slotIndex);
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function QuestionTile({
  compact,
  points,
  disabled,
  onClick,
}: {
  compact: boolean;
  points: number;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-[1rem] border font-black transition ${
        disabled
          ? "cursor-not-allowed border-white/10 bg-slate-800/70 text-slate-500"
          : "border-cyan-400/20 bg-cyan-400/10 text-cyan-200 hover:-translate-y-0.5 hover:bg-cyan-400/20"
      } ${compact ? "px-2 py-4 text-sm" : "px-3 py-5 text-xl md:text-2xl"}`}
    >
      {disabled ? "—" : points}
    </button>
  );
}

function ScoreCard({
  compact,
  title,
  score,
  highlighted,
  onIncrease,
  onDecrease,
}: {
  compact: boolean;
  title: string;
  score: number;
  highlighted: boolean;
  onIncrease: () => void;
  onDecrease: () => void;
}) {
  return (
    <div
      className={`rounded-[1.25rem] border ${
        highlighted
          ? "border-emerald-400/30 bg-emerald-500/10"
          : "border-white/10 bg-white/5"
      } ${compact ? "p-2.5" : "p-3 md:p-4"}`}
    >
      <div className="text-center">
        <p className={`${compact ? "text-xs" : "text-sm"} text-slate-300`}>
          {title}
        </p>
        <p
          className={`mt-2 font-black text-white ${
            compact ? "text-2xl" : "text-4xl"
          }`}
        >
          {score}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onIncrease}
          className={`rounded-xl bg-emerald-500 px-3 py-2 font-black text-white transition hover:bg-emerald-400 ${
            compact ? "text-sm" : "text-lg"
          }`}
        >
          +
        </button>
        <button
          type="button"
          onClick={onDecrease}
          className={`rounded-xl bg-red-500 px-3 py-2 font-black text-white transition hover:bg-red-400 ${
            compact ? "text-sm" : "text-lg"
          }`}
        >
          -
        </button>
      </div>
    </div>
  );
}

function QuestionTimerBar({
  visible,
  timeLabel,
  isRunning,
  onToggle,
  onReset,
}: {
  visible: boolean;
  timeLabel: string;
  isRunning: boolean;
  onToggle: () => void;
  onReset: () => void;
}) {
  if (!visible) return null;

  return (
    <div className="absolute left-1/2 top-3 z-20 -translate-x-1/2 md:top-5">
      <div className="flex items-center gap-3 rounded-full border border-white/10 bg-[#2b2540]/95 px-4 py-2.5 shadow-[0_12px_30px_rgba(0,0,0,0.3)] backdrop-blur md:gap-6 md:px-8 md:py-3">
        <button
          type="button"
          onClick={onToggle}
          className="flex h-9 w-9 items-center justify-center rounded-full text-white transition hover:bg-white/10 md:h-11 md:w-11"
          aria-label={isRunning ? "إيقاف المؤقت مؤقتًا" : "تشغيل المؤقت"}
        >
          {isRunning ? (
            <span className="flex items-center gap-1">
              <span className="block h-7 w-1.5 rounded-full bg-white md:h-8" />
              <span className="block h-7 w-1.5 rounded-full bg-white md:h-8" />
            </span>
          ) : (
            <span className="mr-[-2px] block h-0 w-0 border-y-[10px] border-y-transparent border-r-0 border-l-[16px] border-l-white md:border-y-[12px] md:border-l-[18px]" />
          )}
        </button>

        <div className="min-w-[92px] text-center text-2xl font-black tracking-[0.08em] text-white md:min-w-[120px] md:text-4xl">
          {timeLabel}
        </div>

        <button
          type="button"
          onClick={onReset}
          className="flex h-9 w-9 items-center justify-center rounded-full text-white transition hover:bg-white/10 md:h-11 md:w-11"
          aria-label="إعادة ضبط المؤقت"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            className="h-7 w-7 md:h-8 md:w-8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 12a9 9 0 1 0 3-6.708"
            />
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4v5h5" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function RichHtmlContent({ html }: { html: string }) {
  return (
    <>
      <div className="rich-html-shell">
        <div
          className="rich-html-content"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>

      <style jsx global>{`
        .rich-html-shell {
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .rich-html-content {
          width: 100%;
          max-width: min(100%, 1100px);
          margin: 0 auto;
          text-align: center;
          color: white;
          font-size: 1.15rem;
          line-height: 1.85;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        @media (min-width: 768px) {
          .rich-html-content {
            font-size: 1.9rem;
            line-height: 1.8;
          }
        }

        .rich-html-content > *:first-child {
          margin-top: 0;
        }

        .rich-html-content > *:last-child {
          margin-bottom: 0;
        }

        .rich-html-content h1,
        .rich-html-content h2,
        .rich-html-content h3 {
          font-weight: 900;
          margin: 0 0 16px;
          text-align: center;
          line-height: 1.35;
        }

        .rich-html-content h1 {
          font-size: clamp(1.7rem, 3vw, 3rem);
        }

        .rich-html-content h2 {
          font-size: clamp(1.45rem, 2.5vw, 2.4rem);
        }

        .rich-html-content h3 {
          font-size: clamp(1.2rem, 2vw, 2rem);
        }

        .rich-html-content p,
        .rich-html-content div,
        .rich-html-content span {
          text-align: center;
        }

        .rich-html-content p {
          margin: 0 0 14px;
        }

        .rich-html-content ul,
        .rich-html-content ol {
          margin: 14px auto;
          padding: 0 24px;
          display: inline-block;
          text-align: right;
          max-width: 100%;
        }

        .rich-html-content ul {
          list-style: disc;
        }

        .rich-html-content ol {
          list-style: decimal;
        }

        .rich-html-content figure {
          margin: 20px auto;
          width: 100%;
          max-width: min(100%, 1000px);
        }

        .rich-html-content img,
        .rich-html-content video,
        .rich-html-content iframe {
          display: block !important;
          margin: 20px auto !important;
          width: auto !important;
          max-width: min(100%, 1000px) !important;
          border-radius: 20px;
        }

        .rich-html-content img {
          height: auto !important;
          max-height: min(52vh, 540px) !important;
          object-fit: contain !important;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.28);
        }

        .rich-html-content video {
          width: min(100%, 1000px) !important;
          max-height: min(52vh, 540px) !important;
          height: auto !important;
          background: #000;
          object-fit: contain !important;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.28);
        }

        .rich-html-content iframe {
          width: min(100%, 1000px) !important;
          aspect-ratio: 16 / 9;
          min-height: 220px;
          max-height: min(56vh, 560px);
          height: auto !important;
          border: 0 !important;
          background: #000;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.28);
        }

        .rich-html-content .video-wrap {
          position: relative;
          width: 100%;
          max-width: min(100%, 1000px);
          aspect-ratio: 16 / 9;
          overflow: hidden;
          border-radius: 20px;
          margin: 20px auto;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.28);
        }

        .rich-html-content .video-wrap iframe,
        .rich-html-content .video-wrap video {
          position: absolute;
          inset: 0;
          width: 100% !important;
          height: 100% !important;
          max-height: none !important;
          margin: 0 !important;
          border-radius: 0;
          box-shadow: none;
        }

        .rich-html-content table {
          max-width: 100%;
          margin: 20px auto;
          overflow-x: auto;
          display: block;
        }

        .rich-html-content a {
          color: #22d3ee;
          text-decoration: underline;
        }

        .rich-html-content strong {
          font-weight: 900;
        }

        .rich-html-content em {
          font-style: italic;
        }
      `}</style>
    </>
  );
}