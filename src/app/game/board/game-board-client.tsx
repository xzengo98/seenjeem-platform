"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

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
  default: {
    emoji: "✨",
    gradient: "from-slate-300/20 via-slate-400/10 to-transparent",
  },
};

export default function GameBoardClient({
  sessionId,
  gameName,
  teamOne,
  teamTwo,
  categories,
  questions,
}: Props) {
  const router = useRouter();

  const [teamOneScore, setTeamOneScore] = useState(0);
  const [teamTwoScore, setTeamTwoScore] = useState(0);
  const [usedQuestionIds, setUsedQuestionIds] = useState<string[]>(
    questions.filter((q) => q.is_used).map((q) => q.id)
  );
  const [openQuestion, setOpenQuestion] = useState<OpenQuestion | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showWinnerPicker, setShowWinnerPicker] = useState(false);

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

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="border-b border-white/10 bg-gradient-to-l from-white/10 via-white/5 to-transparent px-6 py-5">
        <div className="mx-auto flex max-w-[1700px] flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-sm text-slate-400">اسم اللعبة</div>
            <div className="text-3xl font-black">{gameName}</div>
          </div>

          <div className="rounded-full bg-orange-400 px-8 py-3 text-xl font-black text-slate-950">
            الحكم هو من يحدد الفريق الصحيح
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/game/start"
              className="rounded-2xl border border-white/10 px-4 py-3 font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              لعبة جديدة
            </Link>
            <Link
              href="/"
              className="rounded-2xl border border-white/10 px-4 py-3 font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              الخروج
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1800px] px-6 py-6">
        <div className="mb-8 grid gap-6 lg:grid-cols-[280px_1fr_280px]">
          <TeamCard name={teamOne} score={teamOneScore} accent="orange" />
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 text-center">
            <div className="text-sm text-slate-400">الجولة الحالية</div>
            <div className="mt-3 text-4xl font-black text-cyan-300">
              {gameName}
            </div>
          </div>
          <TeamCard name={teamTwo} score={teamTwoScore} accent="cyan" />
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {grouped.map((category) => {
            const visual = categoryVisuals[category.slug] ?? categoryVisuals.default;

            return (
              <div
                key={category.id}
                className="rounded-[2.25rem] border border-white/10 bg-white/5 p-4 shadow-[0_20px_80px_-30px_rgba(0,0,0,0.7)]"
              >
                <div className="grid grid-cols-[76px_1fr_76px] gap-3">
                  <div className="space-y-3">
                    {category.slots.filter((_, i) => i % 2 === 0).map((slot) => (
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

                  <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/70">
                    <div
                      className={`relative flex h-[260px] flex-col overflow-hidden bg-gradient-to-br ${visual.gradient}`}
                    >
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_30%)]" />

                      <div className="relative flex flex-1 items-center justify-center px-4">
                        {category.image_url ? (
                          <div className="relative h-[110px] w-[110px] md:h-[130px] md:w-[130px]">
                            <Image
                              src={category.image_url}
                              alt={category.name}
                              fill
                              className="object-contain drop-shadow-[0_12px_30px_rgba(0,0,0,0.35)]"
                            />
                          </div>
                        ) : (
                          <div className="select-none text-[64px] opacity-90 md:text-[78px]">
                            {visual.emoji}
                          </div>
                        )}
                      </div>

                      <div className="relative border-t border-white/10 bg-slate-950/70 px-4 py-4 text-center">
                        <div className="text-2xl font-black">{category.name}</div>
                        <div className="mt-1 text-sm text-cyan-300">{category.slug}</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {category.slots.filter((_, i) => i % 2 === 1).map((slot) => (
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 px-4 py-6">
          <div className="w-full max-w-7xl rounded-[2.5rem] border border-orange-400/40 bg-[#2e2f33] p-6 shadow-2xl md:p-8">
            {!showAnswer && !showWinnerPicker ? (
              <div className="space-y-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="rounded-full bg-orange-400 px-4 py-2 text-sm font-bold text-slate-950">
                    {openQuestion.points} نقطة
                  </div>
                  <div className="rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-slate-200">
                    {openQuestion.categoryName}
                  </div>
                </div>

                <div className="rounded-[2rem] border border-orange-400/40 bg-[#35363a] px-6 py-10 text-center">
                  <h2 className="text-3xl font-black leading-[1.7] md:text-5xl">
                    {openQuestion.question_text}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-2xl border border-white/10 px-6 py-3 font-semibold text-slate-300"
                  >
                    إغلاق
                  </button>

                  <button
                    type="button"
                    onClick={revealAnswer}
                    className="rounded-2xl bg-green-600 px-8 py-4 text-2xl font-black text-white"
                  >
                    الإجابة
                  </button>
                </div>
              </div>
            ) : showAnswer && !showWinnerPicker ? (
              <div className="space-y-8">
                <div className="rounded-[2rem] border border-orange-400/40 bg-[#35363a] px-6 py-10 text-center">
                  <div className="text-lg text-slate-300">الإجابة الصحيحة</div>
                  <h2 className="mt-6 text-4xl font-black leading-[1.5] md:text-6xl">
                    {openQuestion.answer_text ?? "لا توجد إجابة"}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => setShowAnswer(false)}
                    className="rounded-2xl border border-white/10 px-6 py-3 font-semibold text-slate-300"
                  >
                    ارجع للسؤال
                  </button>

                  <button
                    type="button"
                    onClick={goToWinnerPicker}
                    className="rounded-2xl bg-red-600 px-8 py-4 text-2xl font-black text-white"
                  >
                    أي فريق؟
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-10 text-center">
                <h2 className="text-4xl font-black md:text-6xl">أي فريق جاوب صح؟</h2>

                <div className="grid gap-6 md:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => awardPoints("teamOne")}
                    className="rounded-[2rem] bg-red-600 px-8 py-8 text-4xl font-black text-white"
                  >
                    {teamOne}
                  </button>

                  <button
                    type="button"
                    onClick={() => awardPoints("teamTwo")}
                    className="rounded-[2rem] bg-red-600 px-8 py-8 text-4xl font-black text-white"
                  >
                    {teamTwo}
                  </button>

                  <button
                    type="button"
                    onClick={() => awardPoints("none")}
                    className="rounded-[2rem] bg-slate-500 px-8 py-8 text-4xl font-black text-white"
                  >
                    ولا أحد
                  </button>
                </div>

                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setShowWinnerPicker(false)}
                    className="rounded-2xl border border-white/10 px-6 py-3 font-semibold text-slate-300"
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
      className={`flex h-[52px] w-full items-center justify-center rounded-[1.4rem] text-2xl font-black transition ${
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
}: {
  name: string;
  score: number;
  accent: "orange" | "cyan";
}) {
  const accentClass =
    accent === "orange"
      ? "bg-orange-400 text-slate-950"
      : "bg-cyan-400 text-slate-950";

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 text-center">
      <div className={`rounded-2xl px-4 py-3 text-xl font-black ${accentClass}`}>
        {name}
      </div>
      <div className="mt-5 text-6xl font-black">{score}</div>
      <div className="mt-2 text-sm text-slate-400">نقطة</div>
    </div>
  );
}