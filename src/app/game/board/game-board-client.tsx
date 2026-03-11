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

type GroupedCategory = Category & {
  rows: Array<
    Array<{
      points: number;
      question: QuestionRow | null;
      slotIndex: number;
    }>
  >;
};

type BoardContentProps = {
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
};

type BoardState = {
  teamOneScore: number;
  teamTwoScore: number;
  usedQuestionIds: string[];
  openQuestionId: string | null;
  showAnswer: boolean;
  showWinnerPicker: boolean;
  timeLeft: number;
  savedAt: number;
};

const MOBILE_CATEGORY_WIDTH = 152;
const MOBILE_SIDEBAR_WIDTH = 176;
const MOBILE_COLUMN_GAP = 12;
const MOBILE_BOARD_HEIGHT = 590;
const QUESTION_TIMER_SECONDS = 30;

const categoryVisuals: Record<
  string,
  {
    gradient: string;
  }
> = {
  history: {
    gradient: "from-amber-300/20 via-orange-400/10 to-transparent",
  },
  sports: {
    gradient: "from-emerald-300/20 via-green-400/10 to-transparent",
  },
  geography: {
    gradient: "from-sky-300/20 via-cyan-400/10 to-transparent",
  },
  science: {
    gradient: "from-violet-300/20 via-fuchsia-400/10 to-transparent",
  },
  movies: {
    gradient: "from-rose-300/20 via-pink-400/10 to-transparent",
  },
  islamic: {
    gradient: "from-yellow-300/20 via-amber-400/10 to-transparent",
  },
  default: {
    gradient: "from-slate-300/20 via-slate-400/10 to-transparent",
  },
};

function formatCountdown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function getVisualBySlug(slug: string) {
  return categoryVisuals[slug] ?? categoryVisuals.default;
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeBoardState(raw: Record<string, unknown> | null | undefined): BoardState {
  return {
    teamOneScore:
      typeof raw?.teamOneScore === "number" ? raw.teamOneScore : 0,
    teamTwoScore:
      typeof raw?.teamTwoScore === "number" ? raw.teamTwoScore : 0,
    usedQuestionIds: Array.isArray(raw?.usedQuestionIds)
      ? raw.usedQuestionIds.map((value) => String(value))
      : [],
    openQuestionId:
      typeof raw?.openQuestionId === "string" ? raw.openQuestionId : null,
    showAnswer: Boolean(raw?.showAnswer ?? false),
    showWinnerPicker: Boolean(raw?.showWinnerPicker ?? false),
    timeLeft:
      typeof raw?.timeLeft === "number" && raw.timeLeft >= 0
        ? raw.timeLeft
        : QUESTION_TIMER_SECONDS,
    savedAt: typeof raw?.savedAt === "number" ? raw.savedAt : 0,
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
      <p className="text-center text-sm leading-7 text-slate-300 sm:text-base">
        لا يوجد محتوى محفوظ.
      </p>
    );
  }

  return (
    <div
      className={[
        "mx-auto w-full max-w-5xl text-center text-white",
        large
          ? "text-xl leading-10 sm:text-2xl sm:leading-[3.2rem] lg:text-[2rem]"
          : "text-base leading-8 sm:text-lg sm:leading-9",
        "[&_p]:my-4 [&_p]:break-words",
        "[&_strong]:font-black [&_b]:font-black",
        "[&_figure]:my-5 [&_figure]:mx-auto [&_figure]:w-full",
        "[&_img]:mx-auto [&_img]:block [&_img]:max-h-[34vh] sm:[&_img]:max-h-[42vh] lg:[&_img]:max-h-[48vh] [&_img]:w-auto [&_img]:max-w-full [&_img]:rounded-[1.5rem] [&_img]:object-contain [&_img]:border [&_img]:border-white/10 [&_img]:bg-slate-950/70 [&_img]:p-2",
        "[&_video]:mx-auto [&_video]:block [&_video]:max-h-[34vh] sm:[&_video]:max-h-[42vh] lg:[&_video]:max-h-[48vh] [&_video]:w-full [&_video]:max-w-full [&_video]:rounded-[1.5rem] [&_video]:border [&_video]:border-white/10 [&_video]:bg-slate-950/70",
        "[&_iframe]:mx-auto [&_iframe]:block [&_iframe]:aspect-video [&_iframe]:w-full [&_iframe]:max-w-4xl [&_iframe]:rounded-[1.5rem] [&_iframe]:border [&_iframe]:border-white/10 [&_iframe]:bg-slate-950/70",
        "[&_ul]:my-4 [&_ul]:space-y-2 [&_ul]:pr-6 [&_ul]:text-right",
        "[&_ol]:my-4 [&_ol]:space-y-2 [&_ol]:pr-6 [&_ol]:text-right",
      ].join(" ")}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
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
}: BoardContentProps) {
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
      className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-3 sm:p-4"
      style={{
        display: "grid",
        gridTemplateColumns: columns,
        gap: `${gap}px`,
      }}
    >
      {grouped.map((category) => {
        const visual = getVisualBySlug(category.slug);

        return (
          <section
            key={category.id}
            className="overflow-hidden rounded-[1.65rem] border border-white/10 bg-white/[0.04]"
          >
            <div
              className={`relative overflow-hidden border-b border-white/10 bg-gradient-to-br ${visual.gradient} px-3 py-4`}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_30%)]" />
              <div className="relative">
                <p
                  className={`line-clamp-2 text-center font-black text-white ${
                    compact ? "text-base" : "text-lg xl:text-xl"
                  }`}
                >
                  {category.name}
                </p>
              </div>
            </div>

            <div className="grid gap-3 p-3">
              {category.rows.flat().map((slot) => {
                const isUsed =
                  !slot.question || usedQuestionIds.includes(slot.question.id);

                return (
                  <button
                    key={`${category.id}-${slot.slotIndex}`}
                    type="button"
                    disabled={isUsed}
                    onClick={() =>
                      slot.question
                        ? onOpenQuestion(
                            slot.question,
                            category.name,
                            slot.slotIndex
                          )
                        : undefined
                    }
                    className={[
                      "group h-[88px] rounded-[1.25rem] border text-center transition",
                      compact ? "h-[82px]" : "h-[92px]",
                      isUsed
                        ? "cursor-not-allowed border-white/5 bg-slate-900/50 text-slate-500"
                        : "border-white/10 bg-white/5 text-white hover:border-cyan-300/40 hover:bg-cyan-400/10",
                    ].join(" ")}
                  >
                    <div className="flex h-full flex-col items-center justify-center px-2">
                      <span
                        className={[
                          "font-black tracking-tight",
                          compact ? "text-2xl" : "text-[1.8rem]",
                          isUsed ? "text-slate-500" : "text-white",
                        ].join(" ")}
                      >
                        {slot.points}
                      </span>
                      <span
                        className={[
                          "mt-1 text-[11px]",
                          isUsed ? "text-slate-500" : "text-slate-300",
                        ].join(" ")}
                      >
                        {slot.question ? (isUsed ? "تم الاستخدام" : "افتح السؤال") : "غير متاح"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}

      <aside className="rounded-[1.65rem] border border-white/10 bg-white/[0.04] p-3">
        <div className="rounded-[1.35rem] border border-white/10 bg-white/5 p-4 text-center">
          <p className="text-xs text-slate-400">{compact ? "لوحة" : "لعبة"}</p>
          <h2 className="mt-2 line-clamp-2 text-xl font-black text-white">
            {gameName}
          </h2>
          <p className="mt-2 text-xs text-slate-300">
            {leadingTeam === "tie"
              ? "لا يوجد متصدر حاليًا"
              : `المتصدر الآن: ${leadingTeam === "teamOne" ? teamOne : teamTwo}`}
          </p>
        </div>

        <div className="mt-3 space-y-3">
          <ScoreCard
            teamName={teamOne}
            score={teamOneScore}
            isLeading={leadingTeam === "teamOne"}
            onIncrease={onIncTeamOne}
            onDecrease={onDecTeamOne}
            compact={compact}
          />
          <ScoreCard
            teamName={teamTwo}
            score={teamTwoScore}
            isLeading={leadingTeam === "teamTwo"}
            onIncrease={onIncTeamTwo}
            onDecrease={onDecTeamTwo}
            compact={compact}
          />
        </div>
      </aside>
    </div>
  );
}

function ScoreCard({
  teamName,
  score,
  isLeading,
  onIncrease,
  onDecrease,
  compact,
}: {
  teamName: string;
  score: number;
  isLeading: boolean;
  onIncrease: () => void;
  onDecrease: () => void;
  compact: boolean;
}) {
  return (
    <div
      className={[
        "rounded-[1.35rem] border p-3",
        isLeading
          ? "border-cyan-400/30 bg-cyan-400/10"
          : "border-white/10 bg-white/5",
      ].join(" ")}
    >
      <p className="truncate text-center text-sm font-bold text-white">
        {teamName}
      </p>
      <div className="mt-2 text-center text-3xl font-black text-white">
        {score}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onIncrease}
          className={[
            "rounded-xl bg-emerald-500 px-3 py-2 font-black text-white transition hover:bg-emerald-400",
            compact ? "text-sm" : "text-base",
          ].join(" ")}
        >
          +100
        </button>
        <button
          type="button"
          onClick={onDecrease}
          className={[
            "rounded-xl bg-red-600 px-3 py-2 font-black text-white transition hover:bg-red-500",
            compact ? "text-sm" : "text-base",
          ].join(" ")}
        >
          -100
        </button>
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
    Math.min(100, (timeLeft / QUESTION_TIMER_SECONDS) * 100)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/88 p-3 backdrop-blur-sm sm:p-5">
      <div className="flex max-h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.98))] shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
        <div className="border-b border-white/10 px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-bold text-cyan-200">
                {openQuestion.categoryName}
              </span>
              <span className="rounded-full border border-orange-400/20 bg-orange-400/10 px-3 py-1.5 text-xs font-bold text-orange-100">
                {openQuestion.points} نقطة
              </span>
              {toleranceVisible ? (
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-200">
                  السماحية: قبل {openQuestion.year_tolerance_before ?? 0} / بعد{" "}
                  {openQuestion.year_tolerance_after ?? 0}
                </span>
              ) : null}
            </div>

            {!showAnswer && !showWinnerPicker ? (
              <div className="flex flex-wrap items-center gap-2">
                <div className="min-w-[120px] rounded-full border border-white/10 bg-white/5 px-4 py-2 text-center text-lg font-black text-white">
                  {formatCountdown(timeLeft)}
                </div>
                <button
                  type="button"
                  onClick={onToggleTimer}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10"
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
            ) : (
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200">
                {showWinnerPicker ? "تحديد الفريق الفائز" : "عرض الإجابة"}
              </div>
            )}
          </div>

          {!showAnswer && !showWinnerPicker ? (
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-cyan-400 transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
          {!showAnswer && !showWinnerPicker ? (
            <div className="mx-auto flex min-h-full max-w-5xl flex-col justify-center">
              <p className="mb-4 text-center text-sm font-bold text-slate-400 sm:text-base">
                السؤال
              </p>
              <RichContent html={openQuestion.question_text} large />
            </div>
          ) : showAnswer && !showWinnerPicker ? (
            <div className="mx-auto flex min-h-full max-w-5xl flex-col justify-center">
              <p className="mb-4 text-center text-sm font-bold text-emerald-300 sm:text-base">
                الإجابة الصحيحة
              </p>
              <RichContent html={openQuestion.answer_text} large />
            </div>
          ) : (
            <div className="mx-auto flex max-w-4xl flex-col items-center justify-center">
              <h2 className="text-center text-2xl font-black text-white sm:text-4xl">
                أي فريق جاوب صح؟
              </h2>

              <div className="mt-6 grid w-full gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => onAwardPoints("teamOne")}
                  disabled={modalBusy}
                  className="rounded-[1.5rem] bg-rose-600 px-5 py-6 text-xl font-black text-white transition hover:bg-rose-500 disabled:opacity-50 sm:text-2xl"
                >
                  {teamOne}
                </button>

                <button
                  type="button"
                  onClick={() => onAwardPoints("teamTwo")}
                  disabled={modalBusy}
                  className="rounded-[1.5rem] bg-cyan-600 px-5 py-6 text-xl font-black text-white transition hover:bg-cyan-500 disabled:opacity-50 sm:text-2xl"
                >
                  {teamTwo}
                </button>
              </div>

              <button
                type="button"
                onClick={() => onAwardPoints("none")}
                disabled={modalBusy}
                className="mt-3 w-full rounded-[1.5rem] bg-slate-600 px-5 py-5 text-lg font-black text-white transition hover:bg-slate-500 disabled:opacity-50 sm:max-w-md sm:text-xl"
              >
                ولا أحد
              </button>
            </div>
          )}
        </div>

        <div className="border-t border-white/10 px-4 py-4 sm:px-6">
          {!showAnswer && !showWinnerPicker ? (
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={onClose}
                disabled={modalBusy}
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-base font-bold text-white transition hover:bg-white/10 disabled:opacity-50"
              >
                إغلاق
              </button>

              <button
                type="button"
                onClick={onRevealAnswer}
                disabled={modalBusy}
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-emerald-500 px-5 py-3 text-base font-black text-white transition hover:bg-emerald-400 disabled:opacity-50"
              >
                إظهار الإجابة
              </button>
            </div>
          ) : showAnswer && !showWinnerPicker ? (
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={onBackToQuestion}
                disabled={modalBusy}
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-base font-bold text-white transition hover:bg-white/10 disabled:opacity-50"
              >
                ارجع للسؤال
              </button>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={modalBusy}
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-base font-bold text-white transition hover:bg-white/10 disabled:opacity-50"
                >
                  إغلاق
                </button>

                <button
                  type="button"
                  onClick={onGoToWinnerPicker}
                  disabled={modalBusy}
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-cyan-400 px-5 py-3 text-base font-black text-slate-950 transition hover:bg-cyan-300 disabled:opacity-50"
                >
                  أي فريق؟
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={onBackToAnswer}
                disabled={modalBusy}
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-base font-bold text-white transition hover:bg-white/10 disabled:opacity-50"
              >
                العودة للإجابة
              </button>

              <button
                type="button"
                onClick={onClose}
                disabled={modalBusy}
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-base font-bold text-white transition hover:bg-white/10 disabled:opacity-50"
              >
                إغلاق
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
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
  const mobileWrapRef = useRef<HTMLDivElement | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedPayloadRef = useRef<string>("");

  const storageKey = `seenjeem-board-state:${sessionId}`;
  const initialState = useMemo(
    () => normalizeBoardState(initialBoardState),
    [initialBoardState]
  );

  const [teamOneScore, setTeamOneScore] = useState(initialState.teamOneScore);
  const [teamTwoScore, setTeamTwoScore] = useState(initialState.teamTwoScore);
  const [usedQuestionIds, setUsedQuestionIds] = useState<string[]>(
    initialState.usedQuestionIds
  );
  const [restoredOpenQuestionId, setRestoredOpenQuestionId] = useState<string | null>(
    initialState.openQuestionId
  );
  const [openQuestion, setOpenQuestion] = useState<OpenQuestion | null>(null);
  const [showAnswer, setShowAnswer] = useState(initialState.showAnswer);
  const [showWinnerPicker, setShowWinnerPicker] = useState(
    initialState.showWinnerPicker
  );
  const [modalBusy, setModalBusy] = useState(false);
  const [timeLeft, setTimeLeft] = useState(initialState.timeLeft);
  const [timerRunning, setTimerRunning] = useState(false);
  const [mobileScale, setMobileScale] = useState(1);
  const [mobileHeight, setMobileHeight] = useState(MOBILE_BOARD_HEIGHT);

  const boardStateRef = useRef<BoardState>(initialState);

  const grouped = useMemo<GroupedCategory[]>(() => {
    const targetPattern = [200, 200, 400, 400, 600, 600];

    return categories.map((category) => {
      const categoryQuestions = questions
        .filter((question) => question.category_id === category.id)
        .sort((a, b) => {
          if (a.points !== b.points) return a.points - b.points;
          return stripHtml(a.question_text).localeCompare(
            stripHtml(b.question_text),
            "ar"
          );
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

  const playableQuestionIds = useMemo(() => {
    return grouped.flatMap((category) =>
      category.rows.flatMap((row) =>
        row
          .map((slot) => slot.question?.id ?? null)
          .filter((id): id is string => Boolean(id))
      )
    );
  }, [grouped]);

  function buildBoardState(overrides: Partial<BoardState> = {}): BoardState {
    return {
      teamOneScore,
      teamTwoScore,
      usedQuestionIds,
      openQuestionId: restoredOpenQuestionId,
      showAnswer,
      showWinnerPicker,
      timeLeft,
      savedAt: Date.now(),
      ...overrides,
    };
  }

  async function persistToServer(state: BoardState) {
    const payload = JSON.stringify(state);

    if (payload === lastSavedPayloadRef.current) {
      return;
    }

    lastSavedPayloadRef.current = payload;

    const { error } = await supabase
      .from("game_sessions")
      .update({
        board_state: state,
      })
      .eq("id", sessionId)
      .eq("user_id", userId);

    if (error) {
      lastSavedPayloadRef.current = "";
    }
  }

  function queuePersist(state: BoardState, immediate = false) {
    boardStateRef.current = state;
    writeLocalBoardState(storageKey, state);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    if (immediate) {
      void persistToServer(state);
      return;
    }

    saveTimeoutRef.current = setTimeout(() => {
      void persistToServer(state);
    }, 250);
  }

  useEffect(() => {
    const localState = readLocalBoardState(storageKey);

    if (!localState) return;
    if (localState.savedAt <= initialState.savedAt) return;

    setTeamOneScore(localState.teamOneScore);
    setTeamTwoScore(localState.teamTwoScore);
    setUsedQuestionIds(localState.usedQuestionIds);
    setRestoredOpenQuestionId(localState.openQuestionId);
    setShowAnswer(localState.showAnswer);
    setShowWinnerPicker(localState.showWinnerPicker);
    setTimeLeft(localState.timeLeft > 0 ? localState.timeLeft : QUESTION_TIMER_SECONDS);
    setTimerRunning(false);
    boardStateRef.current = localState;
  }, [initialState.savedAt, storageKey]);

  useEffect(() => {
    boardStateRef.current = {
      teamOneScore,
      teamTwoScore,
      usedQuestionIds,
      openQuestionId: restoredOpenQuestionId,
      showAnswer,
      showWinnerPicker,
      timeLeft,
      savedAt: boardStateRef.current.savedAt || initialState.savedAt,
    };
  }, [
    teamOneScore,
    teamTwoScore,
    usedQuestionIds,
    restoredOpenQuestionId,
    showAnswer,
    showWinnerPicker,
    timeLeft,
    initialState.savedAt,
  ]);

  useEffect(() => {
    if (!restoredOpenQuestionId || openQuestion) return;

    for (const category of grouped) {
      for (const row of category.rows) {
        for (const slot of row) {
          if (slot.question?.id === restoredOpenQuestionId) {
            setOpenQuestion({
              ...slot.question,
              categoryName: category.name,
              slotIndex: slot.slotIndex,
            });
            setTimerRunning(false);
            return;
          }
        }
      }
    }

    setRestoredOpenQuestionId(null);
  }, [grouped, restoredOpenQuestionId, openQuestion]);

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
    function flushState() {
      const state = {
        ...boardStateRef.current,
        savedAt: Date.now(),
      };

      writeLocalBoardState(storageKey, state);
      void persistToServer(state);
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        flushState();
      }
    }

    window.addEventListener("pagehide", flushState);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pagehide", flushState);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      flushState();
    };
  }, [storageKey, sessionId, userId, supabase]);

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

      const viewportHeight =
        window.visualViewport?.height ?? window.innerHeight ?? 700;
      const reservedTop = 128;
      const availableHeight = Math.max(viewportHeight - reservedTop, 240);

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

          const nextState = {
            ...boardStateRef.current,
            timeLeft: 0,
            savedAt: Date.now(),
          };

          queuePersist(nextState, true);
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

    const nextState = buildBoardState({
      openQuestionId: question.id,
      showAnswer: false,
      showWinnerPicker: false,
      timeLeft: QUESTION_TIMER_SECONDS,
    });

    setOpenQuestion({
      ...question,
      categoryName,
      slotIndex,
    });
    setRestoredOpenQuestionId(question.id);
    setShowAnswer(false);
    setShowWinnerPicker(false);
    setTimeLeft(QUESTION_TIMER_SECONDS);
    setTimerRunning(true);

    queuePersist(nextState, true);
  }

  function closeModal() {
    if (modalBusy) return;

    const nextState = buildBoardState({
      openQuestionId: null,
      showAnswer: false,
      showWinnerPicker: false,
      timeLeft: QUESTION_TIMER_SECONDS,
    });

    setModalBusy(true);
    setOpenQuestion(null);
    setRestoredOpenQuestionId(null);
    setShowAnswer(false);
    setShowWinnerPicker(false);
    setTimerRunning(false);
    setTimeLeft(QUESTION_TIMER_SECONDS);

    queuePersist(nextState, true);

    setTimeout(() => {
      setModalBusy(false);
    }, 180);
  }

  function revealAnswer() {
    if (modalBusy || !openQuestion) return;

    const nextState = buildBoardState({
      openQuestionId: openQuestion.id,
      showAnswer: true,
      showWinnerPicker: false,
      timeLeft,
    });

    setModalBusy(true);
    setShowAnswer(true);
    setShowWinnerPicker(false);
    setTimerRunning(false);

    queuePersist(nextState, true);

    setTimeout(() => {
      setModalBusy(false);
    }, 180);
  }

  function goToWinnerPicker() {
    if (modalBusy || !openQuestion) return;

    const nextState = buildBoardState({
      openQuestionId: openQuestion.id,
      showAnswer: true,
      showWinnerPicker: true,
      timeLeft,
    });

    setModalBusy(true);
    setShowWinnerPicker(true);
    setTimerRunning(false);

    queuePersist(nextState, true);

    setTimeout(() => {
      setModalBusy(false);
    }, 180);
  }

  function backToQuestion() {
    if (modalBusy || !openQuestion) return;

    const nextState = buildBoardState({
      openQuestionId: openQuestion.id,
      showAnswer: false,
      showWinnerPicker: false,
      timeLeft: QUESTION_TIMER_SECONDS,
    });

    setModalBusy(true);
    setShowAnswer(false);
    setShowWinnerPicker(false);
    setTimeLeft(QUESTION_TIMER_SECONDS);
    setTimerRunning(true);

    queuePersist(nextState, true);

    setTimeout(() => {
      setModalBusy(false);
    }, 180);
  }

  function backToAnswer() {
    if (modalBusy || !openQuestion) return;

    const nextState = buildBoardState({
      openQuestionId: openQuestion.id,
      showAnswer: true,
      showWinnerPicker: false,
      timeLeft,
    });

    setModalBusy(true);
    setShowWinnerPicker(false);
    setShowAnswer(true);
    setTimerRunning(false);

    queuePersist(nextState, true);

    setTimeout(() => {
      setModalBusy(false);
    }, 180);
  }

  function awardPoints(winner: "teamOne" | "teamTwo" | "none") {
    if (!openQuestion || modalBusy) return;

    const nextTeamOneScore =
      winner === "teamOne" ? teamOneScore + openQuestion.points : teamOneScore;
    const nextTeamTwoScore =
      winner === "teamTwo" ? teamTwoScore + openQuestion.points : teamTwoScore;
    const nextUsedQuestionIds = [...usedQuestionIds, openQuestion.id];

    const nextState: BoardState = {
      teamOneScore: nextTeamOneScore,
      teamTwoScore: nextTeamTwoScore,
      usedQuestionIds: nextUsedQuestionIds,
      openQuestionId: null,
      showAnswer: false,
      showWinnerPicker: false,
      timeLeft: QUESTION_TIMER_SECONDS,
      savedAt: Date.now(),
    };

    setModalBusy(true);
    setTeamOneScore(nextTeamOneScore);
    setTeamTwoScore(nextTeamTwoScore);
    setUsedQuestionIds(nextUsedQuestionIds);
    setOpenQuestion(null);
    setRestoredOpenQuestionId(null);
    setShowAnswer(false);
    setShowWinnerPicker(false);
    setTimerRunning(false);
    setTimeLeft(QUESTION_TIMER_SECONDS);

    queuePersist(nextState, true);

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

    const nextState = buildBoardState({
      openQuestionId: openQuestion.id,
      showAnswer,
      showWinnerPicker,
      timeLeft: QUESTION_TIMER_SECONDS,
    });

    setTimeLeft(QUESTION_TIMER_SECONDS);
    setTimerRunning(!showAnswer && !showWinnerPicker);

    queuePersist(nextState, true);
  }

  function increaseTeamOneScore() {
    const nextScore = teamOneScore + 100;
    setTeamOneScore(nextScore);

    const nextState = buildBoardState({
      teamOneScore: nextScore,
    });

    queuePersist(nextState, true);
  }

  function decreaseTeamOneScore() {
    const nextScore = Math.max(teamOneScore - 100, 0);
    setTeamOneScore(nextScore);

    const nextState = buildBoardState({
      teamOneScore: nextScore,
    });

    queuePersist(nextState, true);
  }

  function increaseTeamTwoScore() {
    const nextScore = teamTwoScore + 100;
    setTeamTwoScore(nextScore);

    const nextState = buildBoardState({
      teamTwoScore: nextScore,
    });

    queuePersist(nextState, true);
  }

  function decreaseTeamTwoScore() {
    const nextScore = Math.max(teamTwoScore - 100, 0);
    setTeamTwoScore(nextScore);

    const nextState = buildBoardState({
      teamTwoScore: nextScore,
    });

    queuePersist(nextState, true);
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
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-[1800px] px-3 py-3 sm:px-4 md:px-6 md:py-5">
        <header className="mb-4 rounded-[1.8rem] border border-white/10 bg-[linear-gradient(135deg,#020617_0%,#08122f_50%,#020617_100%)] px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-bold text-cyan-300">SeenJeem</p>
              <h1 className="mt-2 text-2xl font-black text-white sm:text-3xl">
                {gameName}
              </h1>
              <p className="mt-2 text-sm text-slate-300">
                الحكم هو من يحدد الفريق الصحيح بعد عرض الإجابة.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/game/start"
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              >
                لعبة جديدة
              </Link>
              <Link
                href="/"
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-3 text-sm font-bold text-red-200 transition hover:bg-red-500/15"
              >
                الخروج
              </Link>
            </div>
          </div>
        </header>

        {openQuestion ? (
          <QuestionOverlay
            openQuestion={openQuestion}
            teamOne={teamOne}
            teamTwo={teamTwo}
            showAnswer={showAnswer}
            showWinnerPicker={showWinnerPicker}
            modalBusy={modalBusy}
            timeLeft={timeLeft}
            timerRunning={timerRunning}
            onClose={closeModal}
            onRevealAnswer={revealAnswer}
            onGoToWinnerPicker={goToWinnerPicker}
            onBackToQuestion={backToQuestion}
            onBackToAnswer={backToAnswer}
            onToggleTimer={toggleTimer}
            onResetTimer={resetTimer}
            onAwardPoints={awardPoints}
          />
        ) : null}

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
            className="relative overflow-hidden rounded-[1.8rem] border border-white/10 bg-slate-950/70"
            style={{ height: `${mobileHeight}px` }}
          >
            <div
              className="absolute right-0 top-0"
              style={{
                width: `${mobileBoardWidth}px`,
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
    </main>
  );
}