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
      "نظّم الأقسام والفئات والأسئلة من لوحة تحكم واضحة، مع تجربة مناسبة للاستخدام اليومي.",
  },
  {
    title: "لعب مباشر بين فريقين",
    description:
      "ابدأ الجولة بسرعة، اعرض الأسئلة بشكل منسق، وامنح كل فريق تجربة تنافسية واضحة.",
  },
  {
    title: "مناسبة للمدارس والفعاليات",
    description:
      "واجهة منظمة ومريحة للعرض على الشاشات، مناسبة للمسابقات والمناسبات الخاصة.",
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
    description: "اختر الفئات، سمِّ اللعبة، وحدد الفريقين قبل بدء المنافسة.",
  },
  {
    step: "03",
    title: "ابدأ العرض",
    description:
      "اعرض لوحة اللعب وابدأ التفاعل مباشرة أمام الجمهور أو داخل الصف أو الفعالية.",
  },
];

const useCases: UseCaseItem[] = [
  {
    title: "المسابقات المدرسية",
    description: "تنظيم جولات تعليمية ممتعة بأسلوب واضح وسهل للطلاب والمعلمين.",
  },
  {
    title: "الفعاليات الخاصة",
    description: "تشغيل ألعاب أسئلة تفاعلية داخل المناسبات واللقاءات والبرامج الجماعية.",
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
      className="h-5 w-5"
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
      className="h-5 w-5"
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
      className="h-5 w-5"
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
      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
        جارٍ تحميل بيانات الحساب...
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
        ابدأ بحساب جديد أو سجّل الدخول لعرض عدد الألعاب المتاحة لك.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
      أهلًا {username || "بك"} — عدد الألعاب المتبقية:{" "}
      <span className="font-black">{gamesRemaining}</span>
    </div>
  );
}

function FeatureCard({ item }: { item: FeatureItem }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-300">
        <CheckIcon />
      </div>
      <h3 className="text-lg font-black text-white">{item.title}</h3>
      <p className="mt-2 text-sm leading-7 text-slate-300">{item.description}</p>
    </div>
  );
}

function StepCard({ item }: { item: StepItem }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
      <span className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-black text-cyan-200">
        {item.step}
      </span>
      <h3 className="mt-4 text-lg font-black text-white">{item.title}</h3>
      <p className="mt-2 text-sm leading-7 text-slate-300">{item.description}</p>
    </div>
  );
}

function UseCaseCard({ item }: { item: UseCaseItem }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-slate-900/60 p-5">
      <h3 className="text-base font-black text-white">{item.title}</h3>
      <p className="mt-2 text-sm leading-7 text-slate-300">{item.description}</p>
    </div>
  );
}

function FaqCard({ item }: { item: FaqItem }) {
  return (
    <details className="group rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-right text-sm font-bold text-white sm:text-base">
        <span>{item.question}</span>
        <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-300 transition group-open:rotate-45">
          +
        </span>
      </summary>
      <p className="mt-3 text-sm leading-7 text-slate-300">{item.answer}</p>
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
    <div className="mx-auto w-full max-w-[34rem]">
      <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(34,211,238,0.12),rgba(15,23,42,0.95),rgba(249,115,22,0.12))] p-3 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
        <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/90 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-slate-400">معاينة سريعة</p>
              <h3 className="mt-2 text-2xl font-black text-white sm:text-3xl">
                لوحة لعب جاهزة
              </h3>
            </div>
            <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-bold text-cyan-200">
              تجربة أنيقة وواضحة
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-slate-400">الفريق الأول</p>
              <div className="mt-3 text-3xl font-black text-white sm:text-4xl">
                200
              </div>
              <p className="mt-2 text-sm text-slate-300">جاهز لاختيار السؤال التالي</p>
            </div>

            <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-slate-400">الفريق الثاني</p>
              <div className="mt-3 text-3xl font-black text-white sm:text-4xl">
                300
              </div>
              <p className="mt-2 text-sm text-slate-300">يتقدم بفارق سؤال واحد</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-center">
            {["تاريخ", "رياضة", "جغرافيا", "ثقافة عامة"].map((item) => (
              <div
                key={item}
                className="rounded-[1.15rem] border border-white/10 bg-white/5 px-3 py-4"
              >
                <p className="font-bold text-white">{item}</p>
                <p className="mt-2 text-sm text-slate-400">100 • 200 • 300</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-slate-400">الحالة الحالية</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1.5 text-xs font-bold text-white">
                {isLoggedIn ? "الحساب جاهز للعب" : "جرّب المنصة كزائر"}
              </span>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-200">
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
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <section className="relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.12),transparent_24%),linear-gradient(135deg,#020617_0%,#071132_42%,#020617_100%)] p-5 sm:p-7 lg:p-8">
          <div className="grid items-center gap-8 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="order-2 xl:order-1">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-bold text-cyan-200 sm:text-sm">
                  منصة عربية لألعاب الأسئلة
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-200 sm:text-sm">
                  مناسبة للمدارس والفعاليات
                </span>
              </div>

              <div className="mt-5 max-w-3xl">
                <p className="text-sm font-bold text-cyan-300 sm:text-base">
                  مرحبًا بك في لمّتنا
                </p>
                <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
                  حوّل أي مسابقة إلى تجربة
                  <span className="block text-cyan-300">منظمة، سريعة، وتفاعلية</span>
                </h1>
                <p className="mt-5 max-w-2xl text-sm leading-8 text-slate-300 sm:text-base">
                  منصة مهيأة لتشغيل ألعاب الأسئلة بين فريقين بطريقة واضحة وأنيقة،
                  مع تنظيم مرن للفئات والأسئلة وتجربة عرض مناسبة للهواتف والشاشات
                  الكبيرة.
                </p>
              </div>

              <div className="mt-6">
                <StatusBadge
                  loading={loading}
                  isLoggedIn={isLoggedIn}
                  username={username}
                  gamesRemaining={gamesRemaining}
                />
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                {isLoggedIn ? (
                  <>
                    <Link
                      href="/game/start"
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-6 py-3 text-base font-black text-slate-950 transition hover:bg-cyan-300"
                    >
                      ابدأ الآن
                      <ArrowLeftIcon />
                    </Link>

                    <Link
                      href="/account"
                      className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-base font-bold text-white transition hover:bg-white/10"
                    >
                      حسابي
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/register"
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-6 py-3 text-base font-black text-slate-950 transition hover:bg-cyan-300"
                    >
                      إنشاء حساب جديد
                      <ArrowLeftIcon />
                    </Link>

                    <Link
                      href="/login"
                      className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-base font-bold text-white transition hover:bg-white/10"
                    >
                      تسجيل الدخول
                    </Link>
                  </>
                )}
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
                  <p className="text-xs text-slate-400">واجهة مرتبة</p>
                  <p className="mt-2 text-lg font-black text-white">جاهزة للعرض</p>
                </div>
                <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
                  <p className="text-xs text-slate-400">تنظيم ذكي</p>
                  <p className="mt-2 text-lg font-black text-white">أقسام وفئات</p>
                </div>
                <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
                  <p className="text-xs text-slate-400">تشغيل سريع</p>
                  <p className="mt-2 text-lg font-black text-white">بدون تعقيد</p>
                </div>
              </div>
            </div>

            <div className="order-1 xl:order-2">
              <PreviewBoard isLoggedIn={isLoggedIn} gamesRemaining={gamesRemaining} />
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {features.map((item) => (
            <FeatureCard key={item.title} item={item} />
          ))}
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5 sm:p-6">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold text-cyan-300">كيف تبدأ بسرعة؟</p>
              <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">
                3 خطوات واضحة لبدء أي جولة
              </h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
              <SparkIcon />
              تجربة مختصرة وخفيفة
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {steps.map((item) => (
              <StepCard key={item.step} item={item} />
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 sm:p-6">
            <p className="text-sm font-bold text-cyan-300">استخدامات مناسبة</p>
            <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">
              أين يمكن استخدام المنصة؟
            </h2>
            <p className="mt-3 text-sm leading-8 text-slate-300 sm:text-base">
              صُممت المنصة لتكون عملية ومرنة في أكثر من نوع استخدام، سواء للعروض
              التعليمية أو الترفيهية أو المسابقات الداخلية.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {useCases.map((item) => (
                <UseCaseCard key={item.title} item={item} />
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 sm:p-6">
            <p className="text-sm font-bold text-cyan-300">الأسئلة الشائعة</p>
            <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">
              معلومات سريعة قبل البدء
            </h2>

            <div className="mt-6 grid gap-3">
              {faqs.map((item) => (
                <FaqCard key={item.question} item={item} />
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-cyan-400/20 bg-cyan-400/10 p-5 sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold text-cyan-200">جاهز للبدء؟</p>
              <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">
                ابدأ جولتك التالية من هنا
              </h2>
              <p className="mt-2 text-sm leading-8 text-cyan-50/90 sm:text-base">
                اختر الصفحة المناسبة حسب حالتك الحالية، وابدأ بسرعة بدون تعقيد.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              {isLoggedIn ? (
                <>
                  <Link
                    href="/game/start"
                    className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-white px-6 py-3 text-base font-black text-slate-950 transition hover:bg-slate-100"
                  >
                    ابدأ لعبة جديدة
                  </Link>
                  <Link
                    href="/pricing"
                    className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-base font-bold text-white transition hover:bg-white/15"
                  >
                    استعرض الباقات
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-white px-6 py-3 text-base font-black text-slate-950 transition hover:bg-slate-100"
                  >
                    إنشاء حساب
                  </Link>
                  <Link
                    href="/pricing"
                    className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-base font-bold text-white transition hover:bg-white/15"
                  >
                    استعرض الباقات
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>

        <footer className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-5 py-6 sm:px-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-black text-white sm:text-xl">لمّتنا</h3>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
                منصة عربية للمسابقات وألعاب الأسئلة، مصممة لتقديم تجربة جميلة،
                منظمة، وسهلة الاستخدام.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/"
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10 hover:text-white"
              >
                الرئيسية
              </Link>
              <Link
                href="/pricing"
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10 hover:text-white"
              >
                الباقات
              </Link>
              <Link
                href="/game/start"
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10 hover:text-white"
              >
                اللعب
              </Link>
            </div>
          </div>

          <div className="mt-5 border-t border-white/10 pt-4 text-center text-xs text-slate-500 sm:text-sm">
            © {new Date().getFullYear()} لمّتنا — جميع الحقوق محفوظة.
          </div>
        </footer>
      </div>
    </main>
  );
}