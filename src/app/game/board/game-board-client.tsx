"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
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
  initialBoardState: Record<string, unknown> | null;
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

type QuestionSlot = {
  question: QuestionRow | null;
  slotIndex: number;
  points: number;
};

type GroupedCategory = Category & {
  rows: Array<{
    points: number;
    slots: QuestionSlot[];
  }>;
};

type BoardState = {
  teamOneScore: number;
  teamTwoScore: number;
  usedQuestionIds: string[];
  openQuestionId: string | null;
  openQuestionCategoryName: string | null;
  openQuestionSlotIndex: number | null;
  showAnswer: boolean;
  showWinnerPicker: boolean;
  timeLeft: number;
  savedAt: number;
};

const QUESTION_TIMER_SECONDS = 30;
const POINT_ROWS = [200, 400, 600] as const;

const categoryVisuals: Record<
  string,
  {
    glow: string;
    ring: string;
  }
> = {
  history: {
    glow: "from-amber-400/30 via-orange-400/10 to-transparent",
    ring: "hover:border-amber-300/40",
  },
  sports: {
    glow: "from-emerald-400/30 via-green-400/10 to-transparent",
    ring: "hover:border-emerald-300/40",
  },
  geography: {
    glow: "from-sky-400/30 via-cyan-400/10 to-transparent",
    ring: "hover:border-sky-300/40",
  },
  science: {
    glow: "from-violet-400/30 via-fuchsia-400/10 to-transparent",
    ring: "hover:border-violet-300/40",
  },
  movies: {
    glow: "from-pink-400/30 via-rose-400/10 to-transparent",
    ring: "hover:border-pink-300/40",
  },
  islamic: {
    glow: "from-yellow-300/30 via-amber-400/10 to-transparent",
    ring: "hover:border-yellow-300/40",
  },
  default: {
    glow: "from-slate-300/20 via-slate-400/10 to-transparent",
    ring: "hover:border-cyan-300/30",
  },
};

function getVisualBySlug(slug: string) {
  return categoryVisuals[slug] ?? categoryVisuals.default;
}

function formatCountdown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function normalizeBoardState(
  raw: Record<string, unknown> | null | undefined,
): BoardState {
  return {
    teamOneScore:
      typeof raw?.teamOneScore === "number" ? (raw.teamOneScore as number) : 0,
    teamTwoScore:
      typeof raw?.teamTwoScore === "number" ? (raw.teamTwoScore as number) : 0,
    usedQuestionIds: Array.isArray(raw?.usedQuestionIds)
      ? raw.usedQuestionIds.map((value) => String(value))
      : [],
    openQuestionId:
      typeof raw?.openQuestionId === "string"
        ? (raw.openQuestionId as string)
        : null,
    openQuestionCategoryName:
      typeof raw?.openQuestionCategoryName === "string"
        ? (raw.openQuestionCategoryName as string)
        : null,
    openQuestionSlotIndex:
      typeof raw?.openQuestionSlotIndex === "number"
        ? (raw.openQuestionSlotIndex as number)
        : null,
    showAnswer: Boolean(raw?.showAnswer ?? false),
    showWinnerPicker: Boolean(raw?.showWinnerPicker ?? false),
    timeLeft:
      typeof raw?.timeLeft === "number" && (raw.timeLeft as number) >= 0
        ? (raw.timeLeft as number)
        : QUESTION_TIMER_SECONDS,
    savedAt: typeof raw?.savedAt === "number" ? (raw.savedAt as number) : 0,
  };
}

function readLocalBoardState(storageKey: string): BoardState | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return normalizeBoardState(parsed);
  } catch {
    return null;
  }
}

function writeLocalBoardState(storageKey: string, state: BoardState) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {}
}

function RichContent({
  html,
  large = false,
}: {
  html: string | null | undefined;
  large?: boolean;
}) {
  const safeHtml = html?.trim();

  if (!safeHtml) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center text-white/70">
        لا يوجد محتوى محفوظ.
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <div
        className={[
          "prose prose-invert max-w-none text-center prose-headings:text-white prose-p:text-white/90 prose-strong:text-white prose-li:text-white/85 prose-blockquote:text-white/80",
          "prose-p:text-center prose-headings:text-center prose-li:text-right",
          large ? "prose-lg md:prose-xl" : "prose-base md:prose-lg",
          "[&_img]:mx-auto [&_img]:block [&_img]:h-auto [&_img]:w-auto [&_img]:max-w-full [&_img]:max-h-[240px] md:[&_img]:max-h-[340px] [&_img]:object-contain",
          "[&_figure]:mx-auto [&_figure]:text-center [&_figure_img]:mx-auto",
          "[&_iframe]:mx-auto [&_video]:mx-auto",
        ].join(" ")}
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />
    </div>
  );
}

function CategoryHeader({
  category,
}: {
  category: Category;
}) {
  const visual = getVisualBySlug(category.slug);

  return (
    <div className="relative overflow-hidden rounded-[1.25rem] border border-white/10 bg-[#0c1431] px-2 pb-3 pt-3 shadow-[0_14px_40px_rgba(0,0,0,0.25)] md:rounded-[1.6rem] md:px-3 md:pb-4">
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-b ${visual.glow}`}
      />
      <div className="relative flex flex-col items-center gap-2 md:gap-3">
        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-inner md:h-16 md:w-16 md:rounded-2xl">
          {category.image_url ? (
            <img
              src={category.image_url}
              alt={category.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-xl text-white/60 md:text-2xl">?</span>
          )}
        </div>

        <div className="min-h-[42px] text-center md:min-h-[52px]">
          <h3 className="line-clamp-2 text-sm font-black leading-5 text-white md:text-lg md:leading-6">
            {category.name}
          </h3>
        </div>
      </div>
    </div>
  );
}

function QuestionCell({
  slot,
  isUsed,
  onOpen,
  accentSlug,
}: {
  slot: QuestionSlot;
  isUsed: boolean;
  onOpen?: () => void;
  accentSlug: string;
}) {
  const visual = getVisualBySlug(accentSlug);

  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={!slot.question || isUsed}
      className={[
        "group relative flex h-[56px] items-center justify-center overflow-hidden rounded-[1rem] border text-center transition-all duration-200 md:h-[74px] md:rounded-[1.25rem]",
        slot.question && !isUsed
          ? `border-white/10 bg-[#101b42] text-white hover:-translate-y-0.5 hover:bg-[#15245b] ${visual.ring}`
          : "cursor-not-allowed border-white/5 bg-[#0b1230] text-slate-500",
      ].join(" ")}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_60%)]" />

      <div className="relative flex flex-col items-center">
        <span className="text-[1.45rem] font-black leading-none tracking-tight md:text-[2.15rem]">
          {slot.points}
        </span>
        <span className="mt-1 hidden text-[11px] text-white/40 md:block">
          {!slot.question ? "غير متاح" : isUsed ? "تم الاستخدام" : "افتح السؤال"}
        </span>
      </div>
    </button>
  );
}

function ScoreCard({
  teamName,
  score,
  isLeading,
  onIncrease,
  onDecrease,
  accent,
}: {
  teamName: string;
  score: number;
  isLeading: boolean;
  onIncrease: () => void;
  onDecrease: () => void;
  accent: "cyan" | "orange";
}) {
  const accentClasses =
    accent === "cyan"
      ? {
          chip: "bg-cyan-400/15 text-cyan-200 border-cyan-300/20",
          box: "border-cyan-300/20 bg-cyan-400/10",
          btn: "border-cyan-300/20 bg-cyan-400/10 text-cyan-200 hover:bg-cyan-400/20",
        }
      : {
          chip: "bg-orange-400/15 text-orange-200 border-orange-300/20",
          box: "border-orange-300/20 bg-orange-400/10",
          btn: "border-orange-300/20 bg-orange-400/10 text-orange-200 hover:bg-orange-400/20",
        };

  return (
    <div
      className={[
        "rounded-[1.5rem] border bg-[#0b1230] p-3 shadow-[0_18px_40px_rgba(0,0,0,0.28)] md:rounded-[1.8rem] md:p-4",
        isLeading ? "border-white/15" : "border-white/10",
      ].join(" ")}
    >
      <div className="mb-3 flex items-center justify-between gap-3 md:mb-4">
        <span
          className={[
            "rounded-full border px-3 py-1 text-xs font-bold",
            accentClasses.chip,
          ].join(" ")}
        >
          {teamName}
        </span>

        {isLeading ? (
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/70">
            متصدر
          </span>
        ) : null}
      </div>

      <div
        className={[
          "rounded-[1.2rem] border px-3 py-4 text-center md:rounded-[1.4rem] md:py-5",
          accentClasses.box,
        ].join(" ")}
      >
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onDecrease}
            className={[
              "flex h-9 w-9 items-center justify-center rounded-full border text-xl font-black transition md:h-11 md:w-11 md:text-2xl",
              accentClasses.btn,
            ].join(" ")}
          >
            −
          </button>

          <div>
            <div className="text-3xl font-black tracking-tight text-white md:text-5xl">
              {score}
            </div>
            <div className="mt-1 text-xs text-white/50">نقطة</div>
          </div>

          <button
            type="button"
            onClick={onIncrease}
            className={[
              "flex h-9 w-9 items-center justify-center rounded-full border text-xl font-black transition md:h-11 md:w-11 md:text-2xl",
              accentClasses.btn,
            ].join(" ")}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

function BoardSidebar({
  gameName,
  teamOne,
  teamTwo,
  teamOneScore,
  teamTwoScore,
  leadingTeam,
  onIncTeamOne,
  onDecTeamOne,
  onIncTeamTwo,
  onDecTeamTwo,
}: {
  gameName: string;
  teamOne: string;
  teamTwo: string;
  teamOneScore: number;
  teamTwoScore: number;
  leadingTeam: "teamOne" | "teamTwo" | "tie";
  onIncTeamOne: () => void;
  onDecTeamOne: () => void;
  onIncTeamTwo: () => void;
  onDecTeamTwo: () => void;
}) {
  const leaderText =
    leadingTeam === "tie"
      ? "لا يوجد متصدر الآن"
      : `المتصدر الآن: ${leadingTeam === "teamOne" ? teamOne : teamTwo}`;

  return (
    <div className="flex h-full flex-col gap-3 md:gap-4">
      <div className="rounded-[1.5rem] border border-white/10 bg-[#0b1230] p-3 shadow-[0_18px_40px_rgba(0,0,0,0.28)] md:rounded-[1.8rem] md:p-4">
        <div className="text-xs text-white/50">لوحة اللعبة</div>
        <h2 className="mt-2 text-xl font-black text-white md:text-2xl">
          {gameName}
        </h2>
        <p className="mt-2 text-sm text-white/65">{leaderText}</p>
      </div>

      <ScoreCard
        teamName={teamOne}
        score={teamOneScore}
        isLeading={leadingTeam === "teamOne"}
        onIncrease={onIncTeamOne}
        onDecrease={onDecTeamOne}
        accent="cyan"
      />

      <ScoreCard
        teamName={teamTwo}
        score={teamTwoScore}
        isLeading={leadingTeam === "teamTwo"}
        onIncrease={onIncTeamTwo}
        onDecrease={onDecTeamTwo}
        accent="orange"
      />

      <div className="rounded-[1.4rem] border border-white/10 bg-[#0b1230] p-3 md:rounded-[1.6rem]">
        <Link
          href="/account"
          className="flex w-full items-center justify-center rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10 md:rounded-[1.1rem]"
        >
          الرجوع للحساب
        </Link>
      </div>
    </div>
  );
}

function QuestionOverlay({
  openQuestion,
  teamOne,
  teamTwo,
  showAnswer,
  showWinnerPicker,
  modalBusy,
  timeLeft,
  timerRunning,
  onClose,
  onRevealAnswer,
  onGoToWinnerPicker,
  onBackToQuestion,
  onBackToAnswer,
  onToggleTimer,
  onResetTimer,
  onAwardPoints,
}: {
  openQuestion: OpenQuestion;
  teamOne: string;
  teamTwo: string;
  showAnswer: boolean;
  showWinnerPicker: boolean;
  modalBusy: boolean;
  timeLeft: number;
  timerRunning: boolean;
  onClose: () => void;
  onRevealAnswer: () => void;
  onGoToWinnerPicker: () => void;
  onBackToQuestion: () => void;
  onBackToAnswer: () => void;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onAwardPoints: (winner: "teamOne" | "teamTwo" | "none") => void;
}) {
  const toleranceVisible =
    (openQuestion.year_tolerance_before ?? 0) > 0 ||
    (openQuestion.year_tolerance_after ?? 0) > 0;

  const progressPercentage = Math.max(
    0,
    Math.min(100, (timeLeft / QUESTION_TIMER_SECONDS) * 100),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617]/80 p-2 backdrop-blur-md md:p-4">
      <div className="relative flex h-[96vh] w-full max-w-5xl flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#071126] shadow-[0_30px_120px_rgba(0,0,0,0.55)] md:h-[92vh] md:rounded-[2rem]">
        <div className="border-b border-white/10 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.16),transparent_45%)] px-4 py-4 sm:px-6 md:px-7">
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-200">
              {openQuestion.categoryName}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-white/80">
              {openQuestion.points} نقطة
            </span>
            {toleranceVisible ? (
              <span className="rounded-full border border-yellow-300/20 bg-yellow-400/10 px-3 py-1 text-xs font-bold text-yellow-200">
                السماحية: قبل {openQuestion.year_tolerance_before ?? 0} / بعد{" "}
                {openQuestion.year_tolerance_after ?? 0}
              </span>
            ) : null}
          </div>

          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-center lg:text-right">
              <h2 className="text-2xl font-black text-white sm:text-3xl">
                {!showAnswer && !showWinnerPicker
                  ? "السؤال"
                  : showAnswer && !showWinnerPicker
                    ? "الإجابة الصحيحة"
                    : "تحديد الفريق الفائز"}
              </h2>
            </div>

            {!showAnswer && !showWinnerPicker ? (
              <div className="w-full max-w-sm lg:min-w-[240px]">
                <div className="mb-2 flex items-center justify-between text-sm text-white/70">
                  <span>المؤقت</span>
                  <span className="font-black text-white">
                    {formatCountdown(timeLeft)}
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={onToggleTimer}
                    className="rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-sm font-bold text-cyan-100 transition hover:bg-cyan-400/20"
                  >
                    {timerRunning ? "إيقاف الوقت" : "تشغيل الوقت"}
                  </button>

                  <button
                    type="button"
                    onClick={onResetTimer}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10"
                  >
                    إعادة المؤقت
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 md:px-7">
          {!showAnswer && !showWinnerPicker ? (
            <div className="flex min-h-full items-center justify-center">
              <div className="w-full">
                <RichContent html={openQuestion.question_text} large />
              </div>
            </div>
          ) : showAnswer && !showWinnerPicker ? (
            <div className="flex min-h-full items-center justify-center">
              <div className="w-full">
                <RichContent html={openQuestion.answer_text} large />
              </div>
            </div>
          ) : (
            <div className="py-4">
              <div className="mb-6 text-center">
                <h3 className="text-2xl font-black text-white sm:text-3xl">
                  أي فريق جاوب صح؟
                </h3>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => onAwardPoints("teamOne")}
                  disabled={modalBusy}
                  className="rounded-[1.5rem] border border-cyan-300/20 bg-cyan-500/15 px-5 py-8 text-2xl font-black text-cyan-100 transition hover:bg-cyan-500/25 disabled:opacity-50"
                >
                  {teamOne}
                </button>

                <button
                  type="button"
                  onClick={() => onAwardPoints("teamTwo")}
                  disabled={modalBusy}
                  className="rounded-[1.5rem] border border-orange-300/20 bg-orange-500/15 px-5 py-8 text-2xl font-black text-orange-100 transition hover:bg-orange-500/25 disabled:opacity-50"
                >
                  {teamTwo}
                </button>
              </div>

              <button
                type="button"
                onClick={() => onAwardPoints("none")}
                disabled={modalBusy}
                className="mx-auto mt-4 block w-full max-w-md rounded-[1.4rem] border border-white/10 bg-white/5 px-5 py-5 text-lg font-black text-white transition hover:bg-white/10 disabled:opacity-50"
              >
                ولا أحد
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-white/5 px-4 py-4 sm:px-6 md:px-7">
          {!showAnswer && !showWinnerPicker ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/10"
              >
                إغلاق
              </button>

              <button
                type="button"
                onClick={onRevealAnswer}
                className="rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-2.5 text-sm font-bold text-cyan-100 transition hover:bg-cyan-400/20"
              >
                إظهار الإجابة
              </button>
            </>
          ) : showAnswer && !showWinnerPicker ? (
            <>
              <button
                type="button"
                onClick={onBackToQuestion}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/10"
              >
                ارجع للسؤال
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  إغلاق
                </button>

                <button
                  type="button"
                  onClick={onGoToWinnerPicker}
                  className="rounded-xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-2.5 text-sm font-bold text-emerald-100 transition hover:bg-emerald-400/20"
                >
                  أي فريق؟
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onBackToAnswer}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/10"
              >
                العودة للإجابة
              </button>

              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/10"
              >
                إغلاق
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GameBoardClient({
  sessionId,
  initialBoardState,
  gameName,
  teamOne,
  teamTwo,
  categories,
  questions,
}: Props) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const storageKey = `lammatna-board-${sessionId}`;
  const saveTimeoutRef = useRef<number | null>(null);

  const [modalBusy, setModalBusy] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);

  const [boardState, setBoardState] = useState<BoardState>(() => {
    const normalized = normalizeBoardState(initialBoardState);
    return normalized;
  });

  useEffect(() => {
    const localState = readLocalBoardState(storageKey);
    if (localState) {
      setBoardState(localState);
      return;
    }

    setBoardState(normalizeBoardState(initialBoardState));
  }, [initialBoardState, storageKey]);

  const grouped = useMemo<GroupedCategory[]>(() => {
    return categories.map((category) => {
      const categoryQuestions = questions
        .filter((question) => question.category_id === category.id)
        .sort((a, b) => a.points - b.points);

      const rows = POINT_ROWS.map((pointsValue) => {
        const samePoints = categoryQuestions.filter(
          (question) => question.points === pointsValue,
        );

        const slots: QuestionSlot[] =
          samePoints.length > 0
            ? samePoints.map((question, index) => ({
                question,
                slotIndex: index,
                points: pointsValue,
              }))
            : [{ question: null, slotIndex: 0, points: pointsValue }];

        return {
          points: pointsValue,
          slots,
        };
      });

      return {
        ...category,
        rows,
      };
    });
  }, [categories, questions]);

  const openQuestion = useMemo<OpenQuestion | null>(() => {
    if (!boardState.openQuestionId) return null;

    const found = questions.find(
      (question) => question.id === boardState.openQuestionId,
    );

    if (!found) return null;

    return {
      ...found,
      categoryName: boardState.openQuestionCategoryName ?? "السؤال",
      slotIndex: boardState.openQuestionSlotIndex ?? 0,
    };
  }, [
    boardState.openQuestionCategoryName,
    boardState.openQuestionId,
    boardState.openQuestionSlotIndex,
    questions,
  ]);

  const leadingTeam = useMemo<"teamOne" | "teamTwo" | "tie">(() => {
    if (boardState.teamOneScore > boardState.teamTwoScore) return "teamOne";
    if (boardState.teamTwoScore > boardState.teamOneScore) return "teamTwo";
    return "tie";
  }, [boardState.teamOneScore, boardState.teamTwoScore]);

  useEffect(() => {
    writeLocalBoardState(storageKey, boardState);

    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(async () => {
      await supabase
        .from("game_sessions")
        .update({
          board_state: {
            ...boardState,
            savedAt: Date.now(),
          },
        })
        .eq("id", sessionId);
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [boardState, sessionId, storageKey, supabase]);

  useEffect(() => {
    if (!openQuestion || !timerRunning) return;

    const interval = window.setInterval(() => {
      setBoardState((prev) => {
        if (prev.timeLeft <= 1) {
          window.clearInterval(interval);
          return {
            ...prev,
            timeLeft: 0,
          };
        }

        return {
          ...prev,
          timeLeft: prev.timeLeft - 1,
        };
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [openQuestion, timerRunning]);

  useEffect(() => {
    if (!openQuestion) {
      setTimerRunning(false);
    }
  }, [openQuestion]);

  function updateScore(team: "teamOne" | "teamTwo", delta: number) {
    setBoardState((prev) => {
      const nextValue =
        team === "teamOne"
          ? Math.max(0, prev.teamOneScore + delta)
          : Math.max(0, prev.teamTwoScore + delta);

      return {
        ...prev,
        teamOneScore: team === "teamOne" ? nextValue : prev.teamOneScore,
        teamTwoScore: team === "teamTwo" ? nextValue : prev.teamTwoScore,
      };
    });
  }

  function openSlotQuestion(
    question: QuestionRow,
    categoryName: string,
    slotIndex: number,
  ) {
    if (boardState.usedQuestionIds.includes(question.id)) return;

    setBoardState((prev) => ({
      ...prev,
      openQuestionId: question.id,
      openQuestionCategoryName: categoryName,
      openQuestionSlotIndex: slotIndex,
      showAnswer: false,
      showWinnerPicker: false,
      timeLeft: QUESTION_TIMER_SECONDS,
    }));

    setTimerRunning(false);
  }

  function closeQuestion() {
    setBoardState((prev) => ({
      ...prev,
      openQuestionId: null,
      openQuestionCategoryName: null,
      openQuestionSlotIndex: null,
      showAnswer: false,
      showWinnerPicker: false,
      timeLeft: QUESTION_TIMER_SECONDS,
    }));

    setTimerRunning(false);
  }

  function revealAnswer() {
    setBoardState((prev) => ({
      ...prev,
      showAnswer: true,
      showWinnerPicker: false,
    }));
    setTimerRunning(false);
  }

  function backToQuestion() {
    setBoardState((prev) => ({
      ...prev,
      showAnswer: false,
      showWinnerPicker: false,
    }));
  }

  function goToWinnerPicker() {
    setBoardState((prev) => ({
      ...prev,
      showWinnerPicker: true,
    }));
  }

  function backToAnswer() {
    setBoardState((prev) => ({
      ...prev,
      showWinnerPicker: false,
      showAnswer: true,
    }));
  }

  function resetTimer() {
    setBoardState((prev) => ({
      ...prev,
      timeLeft: QUESTION_TIMER_SECONDS,
    }));
    setTimerRunning(false);
  }

  async function awardPoints(winner: "teamOne" | "teamTwo" | "none") {
    if (!openQuestion) return;

    setModalBusy(true);

    try {
      setBoardState((prev) => {
        const used = prev.usedQuestionIds.includes(openQuestion.id)
          ? prev.usedQuestionIds
          : [...prev.usedQuestionIds, openQuestion.id];

        return {
          ...prev,
          usedQuestionIds: used,
          teamOneScore:
            winner === "teamOne"
              ? prev.teamOneScore + openQuestion.points
              : prev.teamOneScore,
          teamTwoScore:
            winner === "teamTwo"
              ? prev.teamTwoScore + openQuestion.points
              : prev.teamTwoScore,
          openQuestionId: null,
          openQuestionCategoryName: null,
          openQuestionSlotIndex: null,
          showAnswer: false,
          showWinnerPicker: false,
          timeLeft: QUESTION_TIMER_SECONDS,
        };
      });

      setTimerRunning(false);
    } finally {
      setModalBusy(false);
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#03091c] text-white">
      <div className="mx-auto max-w-[1800px] px-2 py-3 md:px-5 md:py-6">
        <div className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,#071126_0%,#03081b_100%)] p-2 shadow-[0_25px_80px_rgba(0,0,0,0.35)] md:rounded-[2rem] md:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs text-cyan-200/70">لوحة اللعب</div>
              <h1 className="mt-1 text-xl font-black md:text-3xl">
                {gameName}
              </h1>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70">
                {categories.length} فئات
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70">
                {questions.length} سؤال
              </span>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
            <div className="min-w-0">
              <div
                className="grid gap-2 md:gap-4"
                style={{
                  gridTemplateColumns: `repeat(${Math.max(categories.length, 1)}, minmax(0, 1fr))`,
                }}
              >
                {grouped.map((category) => (
                  <div key={category.id} className="flex min-w-0 flex-col gap-2.5 md:gap-3">
                    <CategoryHeader category={category} />

                    <div className="flex flex-col gap-2">
                      {category.rows.map((row) => (
                        <div
                          key={`${category.id}-${row.points}`}
                          className="grid gap-2"
                          style={{
                            gridTemplateColumns: `repeat(${Math.max(row.slots.length, 1)}, minmax(0, 1fr))`,
                          }}
                        >
                          {row.slots.map((slot) => {
                            const isUsed = !slot.question
                              ? true
                              : boardState.usedQuestionIds.includes(
                                  slot.question.id,
                                );

                            return (
                              <QuestionCell
                                key={`${category.id}-${row.points}-${slot.slotIndex}-${slot.question?.id ?? "empty"}`}
                                slot={slot}
                                isUsed={isUsed}
                                accentSlug={category.slug}
                                onOpen={
                                  slot.question && !isUsed
                                    ? () =>
                                        openSlotQuestion(
                                          slot.question as QuestionRow,
                                          category.name,
                                          slot.slotIndex,
                                        )
                                    : undefined
                                }
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <BoardSidebar
              gameName={gameName}
              teamOne={teamOne}
              teamTwo={teamTwo}
              teamOneScore={boardState.teamOneScore}
              teamTwoScore={boardState.teamTwoScore}
              leadingTeam={leadingTeam}
              onIncTeamOne={() => updateScore("teamOne", 100)}
              onDecTeamOne={() => updateScore("teamOne", -100)}
              onIncTeamTwo={() => updateScore("teamTwo", 100)}
              onDecTeamTwo={() => updateScore("teamTwo", -100)}
            />
          </div>
        </div>
      </div>

      {openQuestion ? (
        <QuestionOverlay
          openQuestion={openQuestion}
          teamOne={teamOne}
          teamTwo={teamTwo}
          showAnswer={boardState.showAnswer}
          showWinnerPicker={boardState.showWinnerPicker}
          modalBusy={modalBusy}
          timeLeft={boardState.timeLeft}
          timerRunning={timerRunning}
          onClose={closeQuestion}
          onRevealAnswer={revealAnswer}
          onGoToWinnerPicker={goToWinnerPicker}
          onBackToQuestion={backToQuestion}
          onBackToAnswer={backToAnswer}
          onToggleTimer={() => setTimerRunning((prev) => !prev)}
          onResetTimer={resetTimer}
          onAwardPoints={awardPoints}
        />
      ) : null}
    </div>
  );
}