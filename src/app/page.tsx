"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Profile = {
  games_remaining: number;
  username: string | null;
};

type FeatureItem = {
  title: string;
  description: string;
};

type StepItem = {
  step: string;
  title: string;
  description: string;
};

type UseCaseItem = {
  title: string;
  description: string;
};

type FaqItem = {
  question: string;
  answer: string;
};

const features: FeatureItem[] = [
  {
    title: "إدارة سهلة وسريعة",
    description:
      "نظّم الأقسام والفئات والأسئلة من لوحة تحكم واضحة ومناسبة للاستخدام اليومي.",
  },
  {
    title: "لعب مباشر بين فريقين",
    description:
      "ابدأ الجولة بسرعة واعرض الأسئلة بشكل واضح وتجربة تنافسية مرتبة.",
  },
  {
    title: "مناسبة للمدارس والفعاليات",
    description:
      "واجهة مناسبة للشاشات والعرض المباشر للمسابقات والبرامج الجماعية.",
  },
];

const steps: StepItem[] = [
  {
    step: "01",
    title: "جهّز المحتوى",
    description: "أضف الأقسام والفئات والأسئلة بالطريقة التي تناسب أسلوب لعبك.",
  },
  {
    step: "02",
    title: "أنشئ الجولة",
    description: "اختر الفئات وسمِّ اللعبة وحدد الفريقين قبل بدء المنافسة.",
  },
  {
    step: "03",
    title: "ابدأ العرض",
    description: "اعرض لوحة اللعب وابدأ التفاعل مباشرة أمام الجمهور.",
  },
];

const useCases: UseCaseItem[] = [
  {
    title: "المسابقات المدرسية",
    description: "تنظيم جولات تعليمية ممتعة بأسلوب واضح وسهل للطلاب والمعلمين.",
  },
  {
    title: "الفعاليات الخاصة",
    description: "تشغيل ألعاب أسئلة تفاعلية داخل المناسبات واللقاءات الجماعية.",
  },
  {
    title: "النوادي والمبادرات",
    description: "تجربة مرنة للمجموعات التي تحتاج جولات سريعة ومنظمة.",
  },
  {
    title: "العروض الترفيهية",
    description: "واجهة جذابة مناسبة للشاشات والعرض المباشر أمام الجمهور.",
  },
];

const faqs: FaqItem[] = [
  {
    question: "هل يمكنني إنشاء أكثر من لعبة؟",
    answer:
      "نعم، حسب عدد الألعاب المتاحة في الحساب يمكنك إنشاء أكثر من جولة والبدء بها وقت الحاجة.",
  },
  {
    question: "هل أستطيع العودة إلى لعبة غير مكتملة؟",
    answer:
      "نعم، الألعاب غير المكتملة يمكن متابعتها لاحقًا من صفحة الحساب إذا كانت محفوظة ضمن حسابك.",
  },
  {
    question: "هل المنصة مناسبة للهاتف والديسكتوب؟",
    answer:
      "نعم، التصميم مهيأ ليظهر بشكل مرتب على الشاشات الكبيرة وكذلك على الهواتف.",
  },
  {
    question: "هل يمكن تخصيص المحتوى حسب الفئة؟",
    answer:
      "نعم، يمكنك إضافة فئات وأسئلة متعددة وتنظيمها بحسب نوع الجولة التي تريد تشغيلها.",
  },
];

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 sm:h-5 sm:w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 sm:h-5 sm:w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        d="M19 12H5M12 19l-7-7 7-7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 sm:h-5 sm:w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        d="m12 3 1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7L12 3Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" />
      <path d="M5 14l.9 2.1L8 17l-2.1.9L5 20l-.9-2.1L2 17l2.1-.9L5 14Z" />
    </svg>
  );
}

function StatusBadge({
  loading,
  isLoggedIn,
  username,
  gamesRemaining,
}: {
  loading: boolean;
  isLoggedIn: boolean;
  username: string | null;
  gamesRemaining: number;
}) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-xs text-slate-300 sm:px-4 sm:text-sm">
        جارٍ تحميل بيانات الحساب...
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-3 text-xs text-cyan-100 sm:px-4 sm:text-sm">
        ابدأ بحساب جديد أو سجّل الدخول لعرض عدد الألعاب المتاحة لك.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-3 text-xs text-emerald-100 sm:px-4 sm:text-sm">
      أهلًا {username || "بك"} — عدد الألعاب المتبقية:{" "}
      <span className="font-black">{gamesRemaining}</span>
    </div>
  );
}

function FeatureCard({ item }: { item: FeatureItem }) {
  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-3 backdrop-blur-sm sm:rounded-[1.5rem] sm:p-5">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-300 sm:mb-4 sm:h-11 sm:w-11">
        <CheckIcon />
      </div>
      <h3 className="text-sm font-black text-white sm:text-lg">{item.title}</h3>
      <p className="mt-2 text-[11px] leading-6 text-slate-300 sm:text-sm sm:leading-7">
        {item.description}
      </p>
    </div>
  );
}

function StepCard({ item }: { item: StepItem }) {
  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-3 sm:rounded-[1.5rem] sm:p-5">
      <span className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-black text-cyan-200 sm:px-3 sm:text-xs">
        {item.step}
      </span>
      <h3 className="mt-3 text-sm font-black text-white sm:mt-4 sm:text-lg">
        {item.title}
      </h3>
      <p className="mt-2 text-[11px] leading-6 text-slate-300 sm:text-sm sm:leading-7">
        {item.description}
      </p>
    </div>
  );
}

function UseCaseCard({ item }: { item: UseCaseItem }) {
  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-slate-900/60 p-3 sm:rounded-[1.5rem] sm:p-5">
      <h3 className="text-sm font-black text-white sm:text-base">{item.title}</h3>
      <p className="mt-2 text-[11px] leading-6 text-slate-300 sm:text-sm sm:leading-7">
        {item.description}
      </p>
    </div>
  );
}

function FaqCard({ item }: { item: FaqItem }) {
  return (
    <details className="group rounded-[1.1rem] border border-white/10 bg-white/5 p-3 sm:rounded-[1.25rem] sm:p-4">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-right text-[11px] font-bold text-white sm:gap-4 sm:text-sm lg:text-base">
        <span>{item.question}</span>
        <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-slate-300 transition group-open:rotate-45 sm:text-xs">
          +
        </span>
      </summary>
      <p className="mt-3 text-[11px] leading-6 text-slate-300 sm:text-sm sm:leading-7">
        {item.answer}
      </p>
    </details>
  );
}

function PreviewBoard({
  isLoggedIn,
  gamesRemaining,
}: {
  isLoggedIn: boolean;
  gamesRemaining: number;
}) {
  return (
    <div className="mx-auto w-full max-w-[185px] sm:max-w-none">
      <div className="rounded-[1.25rem] border border-white/10 bg-[linear-gradient(135deg,rgba(34,211,238,0.12),rgba(15,23,42,0.95),rgba(249,115,22,0.12))] p-1.5 shadow-[0_20px_80px_rgba(0,0,0,0.45)] sm:rounded-[2rem] sm:p-3">
        <div className="rounded-[1.1rem] border border-white/10 bg-slate-950/90 p-2 sm:rounded-[1.75rem] sm:p-5">
          <div className="flex items-start justify-between gap-1.5 sm:gap-3">
            <div className="min-w-0">
              <p className="text-[8px] text-slate-400 sm:text-xs">معاينة سريعة</p>
              <h3 className="mt-1 text-[10px] font-black leading-tight text-white sm:mt-2 sm:text-2xl lg:text-3xl">
                لوحة لعب جاهزة
              </h3>
            </div>
            <span className="shrink-0 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-1.5 py-0.5 text-[8px] font-bold text-cyan-200 sm:px-3 sm:py-1.5 sm:text-xs">
              تجربة أنيقة
            </span>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-1.5 sm:mt-5 sm:gap-3">
            <div className="rounded-[0.85rem] border border-white/10 bg-white/5 p-2 sm:rounded-[1.25rem] sm:p-4">
              <p className="text-[7px] text-slate-400 sm:text-sm">الفريق الأول</p>
              <div className="mt-1 text-[18px] font-black leading-none text-white sm:mt-3 sm:text-3xl lg:text-4xl">
                200
              </div>
              <p className="mt-1 text-[7px] leading-4 text-slate-300 sm:mt-2 sm:text-sm">
                جاهز لاختيار السؤال التالي
              </p>
            </div>

            <div className="rounded-[0.85rem] border border-white/10 bg-white/5 p-2 sm:rounded-[1.25rem] sm:p-4">
              <p className="text-[7px] text-slate-400 sm:text-sm">الفريق الثاني</p>
              <div className="mt-1 text-[18px] font-black leading-none text-white sm:mt-3 sm:text-3xl lg:text-4xl">
                300
              </div>
              <p className="mt-1 text-[7px] leading-4 text-slate-300 sm:mt-2 sm:text-sm">
                يتقدم بفارق سؤال واحد
              </p>
            </div>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-1.5 text-center sm:mt-4 sm:gap-3">
            {["تاريخ", "رياضة", "جغرافيا", "ثقافة عامة"].map((item) => (
              <div
                key={item}
                className="rounded-[0.8rem] border border-white/10 bg-white/5 px-1.5 py-2 sm:rounded-[1.15rem] sm:px-3 sm:py-4"
              >
                <p className="text-[9px] font-bold leading-tight text-white sm:text-sm">
                  {item}
                </p>
                <p className="mt-1 text-[7px] leading-4 text-slate-400 sm:mt-2 sm:text-sm">
                  • 100
                  <br className="sm:hidden" /> • 200
                  <br className="sm:hidden" /> • 300
                </p>
              </div>
            ))}
          </div>

          <div className="mt-2 rounded-[0.9rem] border border-white/10 bg-white/5 p-2 sm:mt-4 sm:rounded-[1.25rem] sm:p-4">
            <p className="text-[7px] text-slate-400 sm:text-sm">الحالة الحالية</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1 sm:mt-3 sm:gap-2">
              <span className="rounded-full border border-white/10 bg-slate-900/70 px-1.5 py-0.5 text-[7px] font-bold text-white sm:px-3 sm:py-1.5 sm:text-xs">
                {isLoggedIn ? "الحساب جاهز للعب" : "جرّب المنصة كزائر"}
              </span>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-1.5 py-0.5 text-[7px] font-bold text-emerald-200 sm:px-3 sm:py-1.5 sm:text-xs">
                {isLoggedIn ? `الألعاب المتاحة: ${gamesRemaining}` : "ابدأ من صفحة التسجيل"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [gamesRemaining, setGamesRemaining] = useState(0);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadState() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (!user) {
        setIsLoggedIn(false);
        setGamesRemaining(0);
        setUsername(null);
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("games_remaining, username")
        .eq("id", user.id)
        .single();

      if (!mounted) return;

      const typedProfile = profile as Profile | null;
      setIsLoggedIn(true);
      setGamesRemaining(typedProfile?.games_remaining ?? 0);
      setUsername(typedProfile?.username ?? null);
      setLoading(false);
    }

    loadState();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadState();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-3 py-4 sm:gap-10 sm:px-6 lg:px-8 lg:py-10">
        <section className="relative overflow-hidden rounded-[1.8rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.12),transparent_24%),linear-gradient(135deg,#020617_0%,#071132_42%,#020617_100%)] p-3 sm:rounded-[2.25rem] sm:p-7 lg:p-8">
          <div className="grid items-center gap-2 grid-cols-[158px_minmax(0,1fr)] sm:gap-8 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="order-1 min-w-0">
              <PreviewBoard
                isLoggedIn={isLoggedIn}
                gamesRemaining={gamesRemaining}
              />
            </div>

            <div className="order-2 min-w-0">
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1.5 text-[10px] font-bold text-cyan-200 sm:px-4 sm:py-2 sm:text-xs">
                  منصة عربية لألعاب الأسئلة
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] font-bold text-slate-200 sm:px-4 sm:py-2 sm:text-xs">
                  مناسبة للمدارس والفعاليات
                </span>
              </div>

              <div className="mt-4 max-w-3xl sm:mt-5">
                <p className="text-[11px] font-bold text-cyan-300 sm:text-sm lg:text-base">
                  مرحبًا بك في لمّتنا
                </p>
                <h1 className="mt-2 text-[20px] font-black leading-tight sm:mt-3 sm:text-4xl lg:text-5xl">
                  حوّل أي مسابقة إلى تجربة
                  <span className="block text-cyan-300">منظمة، سريعة، وتفاعلية</span>
                </h1>
                <p className="mt-3 text-[11px] leading-6 text-slate-300 sm:mt-5 sm:max-w-2xl sm:text-sm sm:leading-8 lg:text-base">
                  منصة مهيأة لتشغيل ألعاب الأسئلة بين فريقين بطريقة واضحة وأنيقة،
                  مع تنظيم مرن للفئات والأسئلة وتجربة عرض مناسبة للهواتف والشاشات
                  الكبيرة.
                </p>
              </div>

              <div className="mt-4 sm:mt-6">
                <StatusBadge
                  loading={loading}
                  isLoggedIn={isLoggedIn}
                  username={username}
                  gamesRemaining={gamesRemaining}
                />
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:mt-6 sm:flex-row sm:gap-3">
                {isLoggedIn ? (
                  <>
                    <Link
                      href="/game/start"
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-2.5 text-sm font-black text-slate-950 transition hover:bg-cyan-300 sm:min-h-12 sm:px-6 sm:py-3 sm:text-base"
                    >
                      ابدأ الآن
                      <ArrowLeftIcon />
                    </Link>

                    <Link
                      href="/account"
                      className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/10 sm:min-h-12 sm:px-6 sm:py-3 sm:text-base"
                    >
                      حسابي
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/register"
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-2.5 text-sm font-black text-slate-950 transition hover:bg-cyan-300 sm:min-h-12 sm:px-6 sm:py-3 sm:text-base"
                    >
                      إنشاء حساب جديد
                      <ArrowLeftIcon />
                    </Link>

                    <Link
                      href="/login"
                      className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/10 sm:min-h-12 sm:px-6 sm:py-3 sm:text-base"
                    >
                      تسجيل الدخول
                    </Link>
                  </>
                )}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 sm:mt-7 sm:gap-3">
                <div className="rounded-[1rem] border border-white/10 bg-white/5 p-2.5 sm:rounded-[1.25rem] sm:p-4">
                  <p className="text-[10px] text-slate-400 sm:text-xs">
                    واجهة مرتبة
                  </p>
                  <p className="mt-1.5 text-xs font-black text-white sm:mt-2 sm:text-lg">
                    جاهزة للعرض
                  </p>
                </div>
                <div className="rounded-[1rem] border border-white/10 bg-white/5 p-2.5 sm:rounded-[1.25rem] sm:p-4">
                  <p className="text-[10px] text-slate-400 sm:text-xs">
                    تنظيم ذكي
                  </p>
                  <p className="mt-1.5 text-xs font-black text-white sm:mt-2 sm:text-lg">
                    أقسام وفئات
                  </p>
                </div>
                <div className="rounded-[1rem] border border-white/10 bg-white/5 p-2.5 sm:rounded-[1.25rem] sm:p-4">
                  <p className="text-[10px] text-slate-400 sm:text-xs">
                    تشغيل سريع
                  </p>
                  <p className="mt-1.5 text-xs font-black text-white sm:mt-2 sm:text-lg">
                    بدون تعقيد
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-3 gap-2 sm:gap-4">
          {features.map((item) => (
            <FeatureCard key={item.title} item={item} />
          ))}
        </section>

        <section className="rounded-[1.8rem] border border-white/10 bg-white/5 p-3 sm:rounded-[2rem] sm:p-6">
          <div className="mb-4 flex flex-col gap-2 sm:mb-6 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
            <div>
              <p className="text-[11px] font-bold text-cyan-300 sm:text-sm">
                كيف تبدأ بسرعة؟
              </p>
              <h2 className="mt-1.5 text-lg font-black text-white sm:mt-2 sm:text-2xl lg:text-3xl">
                3 خطوات واضحة لبدء أي جولة
              </h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] text-slate-300 sm:px-4 sm:py-2 sm:text-sm">
              <SparkIcon />
              تجربة مختصرة وخفيفة
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {steps.map((item) => (
              <StepCard key={item.step} item={item} />
            ))}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[1.8rem] border border-white/10 bg-white/5 p-3 sm:rounded-[2rem] sm:p-6">
            <p className="text-[11px] font-bold text-cyan-300 sm:text-sm">
              استخدامات مناسبة
            </p>
            <h2 className="mt-1.5 text-lg font-black text-white sm:mt-2 sm:text-2xl lg:text-3xl">
              أين يمكن استخدام المنصة؟
            </h2>
            <p className="mt-2 text-[11px] leading-6 text-slate-300 sm:mt-3 sm:text-sm sm:leading-8 lg:text-base">
              صُممت المنصة لتكون عملية ومرنة في أكثر من نوع استخدام، سواء للعروض
              التعليمية أو الترفيهية أو المسابقات الداخلية.
            </p>

            <div className="mt-4 grid gap-2 sm:mt-6 sm:gap-4 sm:grid-cols-2">
              {useCases.map((item) => (
                <UseCaseCard key={item.title} item={item} />
              ))}
            </div>
          </div>

          <div className="rounded-[1.8rem] border border-white/10 bg-white/5 p-3 sm:rounded-[2rem] sm:p-6">
            <p className="text-[11px] font-bold text-cyan-300 sm:text-sm">
              الأسئلة الشائعة
            </p>
            <h2 className="mt-1.5 text-lg font-black text-white sm:mt-2 sm:text-2xl lg:text-3xl">
              معلومات سريعة قبل البدء
            </h2>

            <div className="mt-4 grid gap-2 sm:mt-6 sm:gap-3">
              {faqs.map((item) => (
                <FaqCard key={item.question} item={item} />
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[1.8rem] border border-cyan-400/20 bg-cyan-400/10 p-3 sm:rounded-[2rem] sm:p-6">
          <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] font-bold text-cyan-200 sm:text-sm">
                جاهز للبدء؟
              </p>
              <h2 className="mt-1.5 text-lg font-black text-white sm:mt-2 sm:text-2xl lg:text-3xl">
                ابدأ جولتك التالية من هنا
              </h2>
              <p className="mt-2 text-[11px] leading-6 text-cyan-50/90 sm:text-sm sm:leading-8 lg:text-base">
                اختر الصفحة المناسبة حسب حالتك الحالية، وابدأ بسرعة بدون تعقيد.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
              {isLoggedIn ? (
                <>
                  <Link
                    href="/game/start"
                    className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-white px-4 py-2.5 text-sm font-black text-slate-950 transition hover:bg-slate-100 sm:min-h-12 sm:px-6 sm:py-3 sm:text-base"
                  >
                    ابدأ لعبة جديدة
                  </Link>
                  <Link
                    href="/pricing"
                    className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/15 sm:min-h-12 sm:px-6 sm:py-3 sm:text-base"
                  >
                    استعرض الباقات
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-white px-4 py-2.5 text-sm font-black text-slate-950 transition hover:bg-slate-100 sm:min-h-12 sm:px-6 sm:py-3 sm:text-base"
                  >
                    إنشاء حساب
                  </Link>
                  <Link
                    href="/pricing"
                    className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/15 sm:min-h-12 sm:px-6 sm:py-3 sm:text-base"
                  >
                    استعرض الباقات
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>

        <footer className="rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-4 py-5 sm:rounded-[2rem] sm:px-6 sm:py-6">
          <div className="flex flex-col gap-4 sm:gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-base font-black text-white sm:text-lg lg:text-xl">
                لمّتنا
              </h3>
              <p className="mt-2 max-w-2xl text-[11px] leading-6 text-slate-300 sm:text-sm sm:leading-7">
                منصة عربية للمسابقات وألعاب الأسئلة، مصممة لتقديم تجربة جميلة،
                منظمة، وسهلة الاستخدام على الهاتف والشاشات الكبيرة.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/"
                className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-bold text-slate-200 transition hover:bg-white/10 hover:text-white sm:px-4 sm:text-sm"
              >
                الرئيسية
              </Link>
              <Link
                href="/pricing"
                className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-bold text-slate-200 transition hover:bg-white/10 hover:text-white sm:px-4 sm:text-sm"
              >
                الباقات
              </Link>
              <Link
                href="/game/start"
                className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-bold text-slate-200 transition hover:bg-white/10 hover:text-white sm:px-4 sm:text-sm"
              >
                اللعب
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-bold text-slate-200 transition hover:bg-white/10 hover:text-white sm:px-4 sm:text-sm"
              >
                تسجيل الدخول
              </Link>
            </div>
          </div>

          <div className="mt-4 border-t border-white/10 pt-4 text-center text-[10px] text-slate-500 sm:mt-5 sm:text-xs lg:text-sm">
            © {new Date().getFullYear()} لمّتنا — جميع الحقوق محفوظة.
          </div>
        </footer>
      </div>
    </main>
  );
}