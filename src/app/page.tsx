"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Profile = {
  games_remaining: number;
  username: string | null;
};

type Feature = {
  title: string;
  description: string;
};

type Step = {
  number: string;
  title: string;
  description: string;
};

type Audience = {
  title: string;
  description: string;
};

type FaqItemType = {
  question: string;
  answer: string;
};

const features: Feature[] = [
  {
    title: "واجهة أنيقة وسهلة",
    description:
      "صفحة لعب واضحة وسريعة تساعدك تبدأ الجولة وتتنقل بين الأسئلة بدون تعقيد.",
  },
  {
    title: "مناسبة للفعاليات والمدارس",
    description:
      "استخدمها في المسابقات، الأنشطة المدرسية، اللقاءات العائلية، أو التحديات الجماعية.",
  },
  {
    title: "إدارة مرنة للأسئلة",
    description:
      "رتب الأقسام والفئات والأسئلة بطريقة منظمة حتى تكون تجربة اللعب أكثر احترافية.",
  },
  {
    title: "حفظ التقدم والعودة لاحقًا",
    description:
      "يمكن للمستخدمين العودة للجولات غير المكتملة وإكمال اللعب من نفس المكان بسهولة.",
  },
];

const steps: Step[] = [
  {
    number: "01",
    title: "جهّز اللعبة",
    description:
      "اختر اسم اللعبة وأدخل اسمَي الفريقين حتى تكون الجولة جاهزة للبدء خلال لحظات.",
  },
  {
    number: "02",
    title: "ابدأ التحدي",
    description:
      "انتقل بين الفئات والأسئلة بطريقة مرتبة وواضحة مع عرض مناسب للنقاط وسير اللعب.",
  },
  {
    number: "03",
    title: "أكمل في أي وقت",
    description:
      "لو توقفت الجلسة، يمكن الرجوع إليها لاحقًا ومتابعتها دون فقدان التقدم السابق.",
  },
];

const audiences: Audience[] = [
  {
    title: "للمدارس",
    description:
      "تنظيم مسابقات معرفية سريعة وجذابة داخل الصفوف والفعاليات التعليمية.",
  },
  {
    title: "للفعاليات",
    description:
      "إضافة فقرة تفاعلية ممتعة للمعارض، الملتقيات، والبرامج الجماهيرية.",
  },
  {
    title: "للمناسبات الخاصة",
    description:
      "تحويل الجلسات العائلية واللقاءات الخاصة إلى منافسات ممتعة وسهلة الإدارة.",
  },
  {
    title: "للفرق والمنظمين",
    description:
      "تشغيل اللعبة بسرعة مع واجهة منظمة تناسب من يريد تجربة احترافية بلا تعقيد.",
  },
];

const faqItems: FaqItemType[] = [
  {
    question: "كيف يمكنني إنشاء لعبة في سين جيم؟",
    answer:
      "بعد تسجيل الدخول، يمكنك بدء لعبة جديدة من صفحة البدء، ثم إدخال اسم اللعبة واسمَي الفريقين والانتقال مباشرة إلى لوحة اللعب.",
  },
  {
    question: "هل يمكن تجربة اللعبة قبل الشراء؟",
    answer:
      "يمكن عرض الصفحة الرئيسية والتعرف على آلية المنصة بسهولة، أما بدء الألعاب فيكون بحسب صلاحيات الحساب والباقات المتاحة.",
  },
  {
    question: "هل تتكرر الأسئلة في حال اختيار فئات تم اختيارها مسبقًا؟",
    answer:
      "ذلك يعتمد على إعدادات اللعبة وبنية بنك الأسئلة المستخدم، ويمكن تنظيم الفئات بحيث تكون التجربة أوضح وأكثر تنوعًا.",
  },
  {
    question: "في حال إيقاف اللعبة والرغبة في تكملتها في وقت لاحق، هل يمكن الرجوع لها؟",
    answer:
      "نعم، الجولات غير المكتملة يمكن متابعتها لاحقًا من الحساب طالما لم يتم إنهاؤها أو حذفها.",
  },
  {
    question: "في حال إجابة نصف السؤال، هل يمكن أخذ نصف النقاط؟",
    answer:
      "آلية احتساب النقاط تعتمد على القواعد التي يعتمدها من يدير اللعبة، ويمكن توضيحها للمشاركين قبل بدء الجولة.",
  },
  {
    question: "في حال تواجد كلمة < سنة > فوق السؤال، ما المقصود بها؟",
    answer:
      "يمكن استخدامها كتوضيح إضافي مرتبط بالسؤال مثل السنة أو الحقبة الزمنية، وذلك ليسهّل فهم السياق المطلوب للإجابة.",
  },
  {
    question: "ما معنى علامة VAR داخل السؤال؟",
    answer:
      "يمكن استخدامها كمؤشر بصري أو ملاحظة تنظيمية داخل بنك الأسئلة بحسب أسلوب إعداد اللعبة المعتمد لديك.",
  },
  {
    question:
      "هل يمكنني أخذ سؤال من الفئة التي اختارها الفريق المنافس، أو أخذ أكثر من سؤال من نفس الفئة؟",
    answer:
      "هذا يعود إلى قواعد الجولة التي تعتمدها الجهة المنظمة، ويمكن ضبط أسلوب اللعب بما يناسب نوع المنافسة والجمهور.",
  },
];

export default function HomePage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [gamesRemaining, setGamesRemaining] = useState(0);
  const [username, setUsername] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

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

    void loadState();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadState();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <main dir="rtl" className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pb-16 pt-8 sm:px-6 lg:gap-10 lg:px-8 lg:pb-24 lg:pt-10">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 px-5 py-8 shadow-2xl shadow-slate-950/40 sm:px-8 sm:py-10 lg:px-12 lg:py-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.16),transparent_30%)]" />
          <div className="absolute -right-16 top-10 h-36 w-36 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap gap-3 text-sm text-slate-200">
                <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2">
                  منصة عربية لألعاب الأسئلة
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                  مناسبة للمدارس والفعاليات
                </span>
              </div>

              <div className="max-w-3xl">
                <p className="text-sm font-medium text-cyan-300 sm:text-base">
                  منصة عربية متكاملة لألعاب المعلومات
                </p>
                <h1 className="mt-3 text-3xl font-black leading-tight text-white sm:text-4xl lg:text-5xl">
                  أنشئ تجربة أسئلة احترافية تشد انتباه الزائر من أول لحظة
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                  صمم جولات تفاعلية بين فريقين، نظّم الفئات والأسئلة بشكل أنيق، وابدأ
                  اللعب بواجهة واضحة وسريعة تناسب المسابقات، الفعاليات، المدارس،
                  والمناسبات الخاصة.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <InfoStat title="واجهة منظمة" value="عرض أوضح" />
                <InfoStat title="لعب مرن" value="فريقان وتحدي" />
                <InfoStat title="متابعة لاحقًا" value="بدون فقدان التقدم" />
              </div>

              <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-4 backdrop-blur sm:p-5">
                {loading ? (
                  <div className="flex flex-col gap-3">
                    <p className="text-sm text-slate-300 sm:text-base">
                      جارٍ تحميل حالتك...
                    </p>
                    <div className="h-11 w-full rounded-2xl bg-white/10 sm:max-w-xs" />
                  </div>
                ) : isLoggedIn ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-slate-300">
                          أهلاً {username || "بك"}
                        </p>
                        <p className="mt-1 text-lg font-bold text-white sm:text-xl">
                          عدد الألعاب المتبقية: {gamesRemaining}
                        </p>
                      </div>
                      <span className="w-fit rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">
                        حسابك جاهز للبدء
                      </span>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Link
                        href="/game/start"
                        className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl bg-cyan-400 px-5 py-3 text-base font-bold text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-300"
                      >
                        ابدأ الآن
                      </Link>
                      <Link
                        href="/account"
                        className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-base font-bold text-white transition hover:bg-white/10"
                      >
                        حسابي
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div>
                      <p className="text-lg font-bold text-white sm:text-xl">
                        ابدأ بشكل احترافي من أول زيارة
                      </p>
                      <p className="mt-2 text-sm leading-7 text-slate-300 sm:text-base">
                        أنشئ حسابك وابدأ تجهيز أول لعبة أسئلة عربية بواجهة أجمل وتنظيم
                        أوضح للمستخدمين والزوار.
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Link
                        href="/signup"
                        className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl bg-cyan-400 px-5 py-3 text-base font-bold text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-300"
                      >
                        إنشاء حساب جديد
                      </Link>
                      <Link
                        href="/login"
                        className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-base font-bold text-white transition hover:bg-white/10"
                      >
                        تسجيل الدخول
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="relative">
              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-4 shadow-xl shadow-slate-950/30 backdrop-blur sm:p-5">
                <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/80 p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
                    <div>
                      <p className="text-sm text-slate-400">معاينة سريعة</p>
                      <h2 className="mt-1 text-xl font-bold text-white">
                        لوحة لعبة جاهزة
                      </h2>
                    </div>
                    <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
                      تجربة أوضح للزائر
                    </span>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <PreviewTeamCard
                      teamName="الفريق الأول"
                      score="200"
                      hint="جاهز لاختيار السؤال التالي"
                    />
                    <PreviewTeamCard
                      teamName="الفريق الثاني"
                      score="300"
                      hint="يتقدم بفارق سؤال واحد"
                    />
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <PreviewCategory label="رياضة" points="100 • 200 • 300" />
                    <PreviewCategory label="تاريخ" points="100 • 200 • 300" />
                    <PreviewCategory label="جغرافيا" points="100 • 200 • 300" />
                    <PreviewCategory
                      label="ثقافة عامة"
                      points="100 • 200 • 300"
                    />
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-sm text-slate-400">لماذا هذا مهم؟</p>
                    <p className="mt-2 text-sm leading-7 text-slate-300">
                      بدل أن تبدو الصفحة الرئيسية فارغة، يحصل الزائر على انطباع فوري عن
                      شكل المنصة وقيمتها وطريقة استخدامها.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
          <SectionHeader
            eyebrow="كيف تعمل المنصة"
            title="3 خطوات واضحة للبدء بسرعة"
            description="رتب التجربة للزائر والمستخدم بطريقة بسيطة: من إنشاء اللعبة إلى بدء المنافسة ثم متابعة التقدم لاحقًا."
          />

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {steps.map((step) => (
              <StepCard
                key={step.number}
                number={step.number}
                title={step.title}
                description={step.description}
              />
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.03] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
          <SectionHeader
            eyebrow="استخدامات المنصة"
            title="مناسبة لأكثر من سيناريو"
            description="سواء كنت تدير منافسة مدرسية أو فعالية جماهيرية أو لقاءً خاصًا، الواجهة مصممة لتكون مرتبة وسهلة الفهم."
          />

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {audiences.map((item) => (
              <AudienceCard
                key={item.title}
                title={item.title}
                description={item.description}
              />
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
          <SectionHeader
            eyebrow="الأسئلة الشائعة"
            title="قسم مرتب وواضح بدل عرض طويل ومزدحم"
            description="تم توزيع الأسئلة على شبكة متجاوبة تناسب الهاتف وسطح المكتب، مع فتح الجواب داخل نفس البطاقة بشكل أنيق."
          />

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {faqItems.map((item, index) => (
              <FaqCard
                key={item.question}
                item={item}
                isOpen={openFaqIndex === index}
                onToggle={() =>
                  setOpenFaqIndex((current) =>
                    current === index ? null : index
                  )
                }
              />
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-cyan-400/20 bg-gradient-to-br from-cyan-400/10 via-slate-900 to-orange-500/10 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-medium text-cyan-300">ابدأ الآن</p>
              <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">
                واجهة رئيسية أكثر قوة وتنظيمًا من أول زيارة
              </h2>
              <p className="mt-3 text-base leading-8 text-slate-300">
                هذا التصميم يحافظ على منطق الصفحة الحالي للمستخدم والزائر، لكنه يعرض
                المحتوى بطريقة احترافية أكثر ويملأ الصفحة بعناصر مفيدة وواضحة.
              </p>
            </div>

            {loading ? (
              <div className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-slate-300">
                جارٍ تحميل حالتك...
              </div>
            ) : isLoggedIn ? (
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <Link
                  href="/game/start"
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-cyan-400 px-5 py-3 text-base font-bold text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-300"
                >
                  ابدأ لعبة جديدة
                </Link>
                <Link
                  href="/account"
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-base font-bold text-white transition hover:bg-white/10"
                >
                  انتقل إلى حسابي
                </Link>
              </div>
            ) : (
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <Link
                  href="/signup"
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-cyan-400 px-5 py-3 text-base font-bold text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-300"
                >
                  أنشئ حسابك الآن
                </Link>
                <Link
                  href="/login"
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-base font-bold text-white transition hover:bg-white/10"
                >
                  تسجيل الدخول
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="text-sm font-medium text-cyan-300">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">
        {title}
      </h2>
      <p className="mt-3 text-base leading-8 text-slate-300">{description}</p>
    </div>
  );
}

function InfoStat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4 backdrop-blur">
      <p className="text-sm text-slate-400">{title}</p>
      <p className="mt-2 text-lg font-bold text-white">{value}</p>
    </div>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 transition hover:-translate-y-1 hover:bg-white/[0.06]">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-300">
        <span className="text-lg font-bold">✓</span>
      </div>
      <h3 className="mt-4 text-xl font-bold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base">
        {description}
      </p>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/60 p-5">
      <div className="inline-flex rounded-full border border-orange-400/30 bg-orange-400/10 px-3 py-1 text-sm font-bold text-orange-200">
        {number}
      </div>
      <h3 className="mt-4 text-xl font-bold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base">
        {description}
      </p>
    </div>
  );
}

function AudienceCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/50 p-5">
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base">
        {description}
      </p>
    </div>
  );
}

function PreviewTeamCard({
  teamName,
  score,
  hint,
}: {
  teamName: string;
  score: string;
  hint: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
      <p className="text-sm text-slate-400">{teamName}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-3xl font-black text-white">{score}</p>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
          نقاط
        </span>
      </div>
      <p className="mt-3 text-sm text-slate-300">{hint}</p>
    </div>
  );
}

function PreviewCategory({
  label,
  points,
}: {
  label: string;
  points: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-sm font-semibold text-white">{label}</p>
      <p className="mt-2 text-sm text-slate-400">{points}</p>
    </div>
  );
}

function FaqCard({
  item,
  isOpen,
  onToggle,
}: {
  item: FaqItemType;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/60 p-4 sm:p-5">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-4 text-right"
      >
        <span className="text-base font-bold leading-8 text-white sm:text-lg">
          {item.question}
        </span>
        <span
          className={`mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition ${
            isOpen
              ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-200"
              : "border-white/10 bg-white/5 text-slate-300"
          }`}
          aria-hidden="true"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`h-5 w-5 transition-transform ${
              isOpen ? "rotate-90" : "rotate-0"
            }`}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m9 18 6-6-6-6"
            />
          </svg>
        </span>
      </button>

      {isOpen ? (
        <div className="mt-4 border-t border-white/10 pt-4">
          <p className="text-sm leading-8 text-slate-300 sm:text-base">
            {item.answer}
          </p>
        </div>
      ) : null}
    </div>
  );
}