"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Category = {
  id: string;
  name: string;
  slug: string;
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
  gameName: string;
  teamOne: string;
  teamTwo: string;
  categories: Category[];
  questions: QuestionRow[];
};

type OpenQuestion = QuestionRow & {
  categoryName: string;
};

export default function GameBoardClient({
  gameName,
  teamOne,
  teamTwo,
  categories,
  questions,
}: Props) {
  const [teamOneScore, setTeamOneScore] = useState(0);
  const [teamTwoScore, setTeamTwoScore] = useState(0);
  const [usedQuestionIds, setUsedQuestionIds] = useState<string[]>(
    questions.filter((q) => q.is_used).map((q) => q.id)
  );
  const [openQuestion, setOpenQuestion] = useState<OpenQuestion | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showWinnerPicker, setShowWinnerPicker] = useState(false);

  const grouped = useMemo(() => {
    return categories.map((category) => ({
      ...category,
      questions: questions
        .filter((question) => question.category_id === category.id)
        .sort((a, b) => a.points - b.points),
    }));
  }, [categories, questions]);

  function openQuestionCard(question: QuestionRow, categoryName: string) {
    if (usedQuestionIds.includes(question.id)) return;
    setOpenQuestion({ ...question, categoryName });
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
      <div className="border-b border-white/10 bg-white/5 px-6 py-5">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-sm text-slate-400">اسم اللعبة</div>
            <div className="text-3xl font-black">{gameName}</div>
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

      <div className="mx-auto max-w-[1600px] px-6 py-6">
        <div className="mb-6 grid gap-6 lg:grid-cols-[280px_1fr_280px]">
          <TeamCard name={teamOne} score={teamOneScore} />
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 text-center">
            <div className="text-sm text-slate-400">دور اللعب</div>
            <div className="mt-2 text-2xl font-black text-cyan-300">
              الحكم هو من يحدد الفريق الصحيح
            </div>
          </div>
          <TeamCard name={teamTwo} score={teamTwoScore} />
        </div>

        <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${Math.max(categories.length, 1)}, minmax(0, 1fr))` }}>
          {grouped.map((category) => (
            <div
              key={category.id}
              className="rounded-[2rem] border border-white/10 bg-white/5 p-4"
            >
              <div className="mb-4 rounded-2xl bg-slate-900/70 px-4 py-5 text-center">
                <div className="text-2xl font-black">{category.name}</div>
                <div className="mt-2 text-sm text-cyan-300">{category.slug}</div>
              </div>

              <div className="space-y-4">
                {[200, 400, 600].map((points) => {
                  const question = category.questions.find((q) => q.points === points);
                  const used = question ? usedQuestionIds.includes(question.id) : true;

                  return (
                    <button
                      key={points}
                      type="button"
                      disabled={!question || used}
                      onClick={() =>
                        question && openQuestionCard(question, category.name)
                      }
                      className={`flex h-24 w-full items-center justify-center rounded-[2rem] text-4xl font-black transition ${
                        !question
                          ? "cursor-not-allowed border border-white/5 bg-slate-900/30 text-slate-700"
                          : used
                          ? "cursor-not-allowed border border-white/10 bg-slate-900/60 text-slate-500 line-through"
                          : "border border-cyan-400/20 bg-cyan-400/10 text-cyan-300 hover:bg-cyan-400/20"
                      }`}
                    >
                      {points}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {openQuestion ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 px-6 py-8">
          <div className="w-full max-w-6xl rounded-[2.5rem] border border-orange-400/40 bg-[#2e2f33] p-8 shadow-2xl">
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

                <div className="text-center">
                  <h2 className="text-4xl font-black leading-[1.5]">
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
                    className="rounded-2xl bg-green-500 px-8 py-4 text-2xl font-black text-white"
                  >
                    إظهار الإجابة
                  </button>
                </div>
              </div>
            ) : showAnswer && !showWinnerPicker ? (
              <div className="space-y-8">
                <div className="text-center">
                  <div className="text-sm text-slate-400">الإجابة</div>
                  <h2 className="mt-4 text-5xl font-black leading-[1.4] text-white">
                    {openQuestion.answer_text ?? "لا توجد إجابة"}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => setShowAnswer(false)}
                    className="rounded-2xl border border-white/10 px-6 py-3 font-semibold text-slate-300"
                  >
                    رجوع للسؤال
                  </button>

                  <button
                    type="button"
                    onClick={goToWinnerPicker}
                    className="rounded-2xl bg-red-600 px-8 py-4 text-2xl font-black text-white"
                  >
                    أي فريق جاوب صح؟
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-10 text-center">
                <h2 className="text-5xl font-black">أي فريق جاوب صح؟</h2>

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
                    className="rounded-[2rem] bg-slate-400 px-8 py-8 text-4xl font-black text-white"
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

function TeamCard({ name, score }: { name: string; score: number }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 text-center">
      <div className="rounded-2xl bg-orange-400 px-4 py-3 text-xl font-black text-slate-950">
        {name}
      </div>
      <div className="mt-5 text-6xl font-black">{score}</div>
      <div className="mt-2 text-sm text-slate-400">نقطة</div>
    </div>
  );
}