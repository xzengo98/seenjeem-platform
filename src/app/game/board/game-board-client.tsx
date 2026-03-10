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
        slots,
      };
    });
  }, [categories, questions]);

  useEffect(() => {
    const openQuestionId = initialBoardState?.openQuestionId;

    if (!openQuestionId) return;
    if (openQuestion) return;

    for (const category of grouped) {
      for (const slot of category.slots) {
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
  }, [grouped, initialBoardState, openQuestion]);

  const playableQuestionIds = useMemo(() => {
    return grouped.flatMap((category) =>
      category.slots
        .map((slot) => slot.question?.id ?? null)
        .filter((id): id is string => Boolean(id))
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

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="border-b border-white/10 bg-gradient-to-l from-white/10 via-white/5 to-transparent px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-5">
        <div className="mx-auto max-w-[1800px]">
          <div className="grid grid-cols-2 items-center gap-2 md:flex md:flex-wrap md:items-center md:justify-between md:gap-4">
            <div className="order-2 text-right md:order-1">
              <div className="text-[10px] text-slate-400 sm:text-xs">اسم اللعبة</div>
              <div className="text-lg font-black sm:text-xl md:text-3xl">
                {gameName}
              </div>
            </div>

            <div className="order-1 col-span-2 flex justify-center md:order-2">
              <div className="rounded-full bg-orange-400 px-4 py-2 text-center text-xs font-black text-slate-950 sm:px-6 sm:text-sm md:px-8 md:py-3 md:text-xl">
                الحكم هو من يحدد الفريق الصحيح
              </div>
            </div>

            <div className="order-3 col-span-2 flex justify-start gap-2 md:col-span-1 md:justify-end md:gap-3">
              <Link
                href="/game/start"
                className="rounded-2xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white sm:px-4 sm:text-sm md:px-4 md:py-3"
              >
                لعبة جديدة
              </Link>
              <Link
                href="/"
                className="rounded-2xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white sm:px-4 sm:text-sm md:px-4 md:py-3"
              >
                الخروج
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1800px] px-2 py-3 sm:px-3 sm:py-4 md:px-6 md:py-6">
        <div className="mb-3 grid grid-cols-[1fr_1.25fr_1fr] gap-2 sm:mb-4 sm:gap-3 md:mb-8 md:grid-cols-[280px_1fr_280px] md:gap-6">
          <TeamCard
            name={teamOne}
            score={teamOneScore}
            accent="orange"
            onIncrease={increaseTeamOneScore}
            onDecrease={decreaseTeamOneScore}
            isLeading={leadingTeam === "teamOne"}
            isTie={leadingTeam === "tie"}
          />

          <div className="rounded-[1.2rem] border border-white/10 bg-white/5 p-3 text-center sm:rounded-[1.4rem] sm:p-4 md:rounded-[2rem] md:p-6">
            <div className="text-[10px] text-slate-400 sm:text-xs md:text-sm">
              الجولة الحالية
            </div>
            <div className="mt-1 text-lg font-black text-cyan-300 sm:text-xl md:mt-3 md:text-4xl">
              {gameName}
            </div>

            <div className="mt-2 text-[10px] font-bold sm:text-xs md:mt-4 md:text-sm">
              {leadingTeam === "tie" ? (
                <span className="text-slate-400">لا يوجد متصدر حاليًا</span>
              ) : (
                <span className="text-emerald-300">
                  المتصدر الآن: {leadingTeam === "teamOne" ? teamOne : teamTwo}
                </span>
              )}
            </div>
          </div>

          <TeamCard
            name={teamTwo}
            score={teamTwoScore}
            accent="cyan"
            onIncrease={increaseTeamTwoScore}
            onDecrease={decreaseTeamTwoScore}
            isLeading={leadingTeam === "teamTwo"}
            isTie={leadingTeam === "tie"}
          />
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3 xl:gap-6">
          {grouped.map((category) => {
            const visual = categoryVisuals[category.slug] ?? categoryVisuals.default;

            return (
              <div
                key={category.id}
                className="rounded-[1rem] border border-white/10 bg-white/5 p-2 shadow-[0_20px_80px_-30px_rgba(0,0,0,0.7)] sm:rounded-[1.2rem] sm:p-2.5 md:rounded-[2.25rem] md:p-4"
              >
                <div className="grid grid-cols-[42px_1fr_42px] gap-1 sm:grid-cols-[48px_1fr_48px] sm:gap-2 md:grid-cols-[76px_1fr_76px] md:gap-3">
                  <div className="space-y-1 sm:space-y-2 md:space-y-3">
                    {category.slots
                      .filter((_, i) => i % 2 === 0)
                      .map((slot) => (
                        <PointsButton
                          key={`${category.id}-left-${slot.slotIndex}`}
                          slot={slot}
                          usedQuestionIds={usedQuestionIds}
                          onOpen={(question) =>
                            openQuestionCard(question, category.name, slot.slotIndex)
                          }
                        />
                      ))}
                  </div>

                  <div className="overflow-hidden rounded-[1rem] border border-white/10 bg-slate-900/70 sm:rounded-[1.2rem] md:rounded-[2rem]">
                    <div
                      className={`relative flex h-[118px] flex-col overflow-hidden bg-gradient-to-br sm:h-[135px] md:h-[260px] ${visual.gradient}`}
                    >
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_30%)]" />

                      <div className="relative flex flex-1 items-center justify-center px-2 md:px-4">
                        {category.image_url ? (
                          <div className="relative h-[34px] w-[34px] sm:h-[42px] sm:w-[42px] md:h-[130px] md:w-[130px]">
                            <Image
                              src={category.image_url}
                              alt={category.name}
                              fill
                              className="object-contain drop-shadow-[0_12px_30px_rgba(0,0,0,0.35)]"
                            />
                          </div>
                        ) : (
                          <div className="select-none text-[24px] opacity-90 sm:text-[30px] md:text-[78px]">
                            {visual.emoji}
                          </div>
                        )}
                      </div>

                      <div className="relative border-t border-white/10 bg-slate-950/70 px-2 py-2 text-center md:px-4 md:py-4">
                        <div className="line-clamp-2 text-[12px] font-black leading-4 sm:text-[13px] sm:leading-5 md:text-2xl md:leading-normal">
                          {category.name}
                        </div>
                        <div className="mt-1 text-[9px] text-cyan-300 sm:text-[10px] md:text-sm">
                          {category.slug}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 sm:space-y-2 md:space-y-3">
                    {category.slots
                      .filter((_, i) => i % 2 === 1)
                      .map((slot) => (
                        <PointsButton
                          key={`${category.id}-right-${slot.slotIndex}`}
                          slot={slot}
                          usedQuestionIds={usedQuestionIds}
                          onOpen={(question) =>
                            openQuestionCard(question, category.name, slot.slotIndex)
                          }
                        />
                      ))}
                  </div>
                </div>
              </div>
            );
          })}
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

function PointsButton({
  slot,
  usedQuestionIds,
  onOpen,
}: {
  slot: {
    points: number;
    question: QuestionRow | null;
    slotIndex: number;
  };
  usedQuestionIds: string[];
  onOpen: (question: QuestionRow) => void;
}) {
  const question = slot.question;
  const used = question ? usedQuestionIds.includes(question.id) : true;

  return (
    <button
      type="button"
      disabled={!question || used}
      onClick={() => question && onOpen(question)}
      className={`flex h-[36px] w-full items-center justify-center rounded-[1rem] text-sm font-black transition sm:h-[40px] sm:rounded-[1.1rem] sm:text-base md:h-[52px] md:rounded-[1.4rem] md:text-2xl ${
        !question
          ? "cursor-not-allowed border border-white/5 bg-slate-900/30 text-slate-700"
          : used
          ? "cursor-not-allowed border border-white/10 bg-slate-900/60 text-slate-500 line-through"
          : "border border-cyan-400/20 bg-cyan-400/10 text-cyan-300 hover:bg-cyan-400/20"
      }`}
    >
      {slot.points}
    </button>
  );
}

function TeamCard({
  name,
  score,
  accent,
  onIncrease,
  onDecrease,
  isLeading,
  isTie,
}: {
  name: string;
  score: number;
  accent: "orange" | "cyan";
  onIncrease: () => void;
  onDecrease: () => void;
  isLeading: boolean;
  isTie: boolean;
}) {
  const accentClass =
    accent === "orange"
      ? "bg-orange-400 text-slate-950"
      : "bg-cyan-400 text-slate-950";

  const actionClass =
    accent === "orange"
      ? "border-orange-400/30 bg-orange-400/10 text-orange-300 hover:bg-orange-400/20"
      : "border-cyan-400/30 bg-cyan-400/10 text-cyan-300 hover:bg-cyan-400/20";

  const leadingWrapper =
    isLeading && !isTie
      ? accent === "orange"
        ? "border-orange-300/40 bg-orange-400/10 shadow-[0_0_30px_rgba(251,146,60,0.15)]"
        : "border-cyan-300/40 bg-cyan-400/10 shadow-[0_0_30px_rgba(34,211,238,0.15)]"
      : "border-white/10 bg-white/5";

  const leadingBadge =
    isLeading && !isTie
      ? accent === "orange"
        ? "bg-orange-400/20 text-orange-200 border-orange-300/30"
        : "bg-cyan-400/20 text-cyan-200 border-cyan-300/30"
      : "hidden";

  return (
    <div
      className={`rounded-[1.2rem] border p-3 text-center transition sm:rounded-[1.4rem] sm:p-4 md:rounded-[2rem] md:p-5 ${leadingWrapper}`}
    >
      <div className="mb-2 flex min-h-[24px] items-center justify-center md:mb-3">
        <div className={`rounded-full border px-3 py-1 text-[10px] font-bold sm:text-xs ${leadingBadge}`}>
          متصدر
        </div>
      </div>

      <div
        className={`rounded-xl px-2 py-2 text-sm font-black sm:text-base md:rounded-2xl md:px-4 md:py-3 md:text-xl ${accentClass}`}
      >
        <span className="line-clamp-1 block">{name}</span>
      </div>

      <div className="mt-3 flex items-center justify-center gap-2 sm:gap-3 md:mt-5 md:gap-4">
        <button
          type="button"
          onClick={onDecrease}
          className={`flex h-8 w-8 items-center justify-center rounded-full border text-base font-black transition sm:h-9 sm:w-9 md:h-12 md:w-12 md:text-2xl ${actionClass}`}
          aria-label={`تقليل نقاط ${name}`}
        >
          −
        </button>

        <div className="min-w-[64px] rounded-2xl border border-white/10 bg-slate-900/70 px-2 py-2 sm:min-w-[72px] md:min-w-[110px] md:px-5 md:py-3">
          <div className="text-3xl font-black sm:text-4xl md:text-5xl">
            {score}
          </div>
        </div>

        <button
          type="button"
          onClick={onIncrease}
          className={`flex h-8 w-8 items-center justify-center rounded-full border text-base font-black transition sm:h-9 sm:w-9 md:h-12 md:w-12 md:text-2xl ${actionClass}`}
          aria-label={`زيادة نقاط ${name}`}
        >
          +
        </button>
      </div>

      <div className="mt-2 text-[10px] text-slate-400 sm:text-xs md:text-sm">
        نقطة
      </div>
    </div>
  );
}