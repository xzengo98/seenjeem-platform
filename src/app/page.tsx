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
    title: "تشغيل سريع",
    description:
      "ابدأ اللعبة خلال دقائق بواجهة واضحة تساعدك على تنظيم الجولة بدون تعقيد.",
  },
  {
    title: "إدارة مرنة",
    description:
      "نظّم الفئات والأسئلة والنقاط بطريقة مرتبة تناسب مختلف أنواع المسابقات.",
  },
  {
    title: "تجربة تفاعلية",
    description:
      "واجهة مهيأة للمنافسات بين فريقين بأسلوب جذاب وسهل المتابعة أثناء اللعب.",
  },
  {
    title: "حفظ التقدم",
    description:
      "يمكن متابعة الجولات غير المكتملة لاحقًا دون فقدان خطوات اللعب السابقة.",
  },
];

const steps: Step[] = [
  {
    number: "01",
    title: "أنشئ اللعبة",
    description: "اختر اسم اللعبة وأدخل أسماء الفرق لتجهيز الجولة بسرعة.",
  },
  {
    number: "02",
    title: "ابدأ المنافسة",
    description: "انتقل بين الفئات والأسئلة بسهولة مع عرض واضح للنقاط.",
  },
  {
    number: "03",
    title: "تابع لاحقًا",
    description: "احتفظ بتقدمك وارجع للجولات غير المكتملة في أي وقت.",
  },
];

const audiences: Audience[] = [
  {
    title: "للمدارس",
    description:
      "خيار مناسب للمسابقات الصفية والأنشطة التعليمية والفعاليات المدرسية.",
  },
  {
    title: "للفعاليات",
    description:
      "أضف فقرة تفاعلية ممتعة للمعارض، اللقاءات، والمناسبات الجماهيرية.",
  },
  {
    title: "للفرق والشركات",
    description:
      "مناسب للتحديات الجماعية، الأنشطة الداخلية، والمسابقات الترفيهية.",
  },
  {
    title: "للمناسبات الخاصة",
    description:
      "حوّل الجلسات العائلية واللقاءات الخاصة إلى منافسات ممتعة ومنظمة.",
  },
];

const faqItems: FaqItemType[] = [
  {
    question: "كيف أبدأ لعبة جديدة في SeenJeem؟",
    answer:
      "بعد تسجيل الدخول، يمكنك بدء لعبة جديدة مباشرة من صفحة البدء ثم إدخال اسم اللعبة وأسماء الفرق والانتقال إلى لوحة اللعب.",
  },
  {
    question: "هل يمكنني الرجوع للعبة غير المكتملة لاحقًا؟",
    answer:
      "نعم، يمكن متابعة الجولات غير المكتملة لاحقًا من الحساب ما دامت لم تُنهَ أو تُحذف.",
  },
  {
    question: "هل المنصة مناسبة للمدارس والفعاليات؟",
    answer:
      "نعم، تم تصميم المنصة لتناسب المسابقات المدرسية والفعاليات العامة واللقاءات الخاصة بأسلوب واضح ومرن.",
  },
  {
    question: "هل يمكن استخدام اللعبة بين فريقين؟",
    answer:
      "نعم، تعتمد المنصة على تجربة تنافسية واضحة بين فريقين مع عرض مناسب للنقاط وسير اللعب.",
  },
  {
    question: "هل تظهر الفئات والأسئلة بطريقة منظمة؟",
    answer:
      "نعم، يتم عرض الفئات والأسئلة بشكل مرتب ليسهّل على مقدّم اللعبة والفرق متابعة الجولة بسهولة.",
  },
  {
    question: "هل يمكن تخصيص طريقة احتساب النقاط؟",
    answer:
      "طريقة اعتماد النقاط تعود إلى أسلوب إدارة الجولة، ويمكن تشغيل اللعبة بما يتناسب مع قوانين المسابقة لديك.",
  },
  {
    question: "هل المنصة مناسبة للشاشات المختلفة؟",
    answer:
      "نعم، تم تصميم الواجهة لتعمل بشكل جيد على أجهزة سطح المكتب والهواتف مع الحفاظ على ترتيب واضح قدر الإمكان.",
  },
  {
    question: "هل أحتاج خبرة تقنية لاستخدام المنصة؟",
    answer:
      "لا، الواجهة مبسطة وسهلة الاستخدام، ويمكن البدء بها بسرعة دون الحاجة إلى خبرة تقنية متقدمة.",
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
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-3 pb-10 pt-4 sm:gap-8 sm:px-6 sm:pb-16 sm:pt-8 lg:gap-10 lg:px-8 lg:pb-24 lg:pt-10">
        <section className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 px-3 py-4 shadow-2xl shadow-slate-950/40 sm:rounded-[2rem] sm:px-8 sm:py-10 lg:px-12 lg:py-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.16),transparent_30%)]" />
          <div className="absolute -right-16 top-10 h-36 w-36 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />

          <div className="relative grid grid-cols-[0.78fr_1.22fr] items-start gap-2.5 max-[390px]:grid-cols-[0.76fr_1.24fr] sm:gap-8 lg:items-center">
            <div className="min-w-0 flex flex-col gap-2.5 sm:gap-6">
              <div className="flex flex-wrap gap-1.5 text-[8px] text-slate-200 max-[390px]:text-[7.5px] sm:gap-3 sm:text-sm">
                <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-1 leading-none sm:px-4 sm:py-2">
                  <span className="sm:hidden">منصة عربية</span>
                  <span className="hidden sm:inline">منصة عربية للألعاب التفاعلية</span>
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 leading-none sm:px-4 sm:py-2">
                  <span className="sm:hidden">للمدارس والفعاليات</span>
                  <span className="hidden sm:inline">
                    مناسبة للمدارس والفعاليات والتجمعات
                  </span>
                </span>
              </div>

              <div className="max-w-3xl">
                <p className="text-[10px] font-medium text-cyan-300 max-[390px]:text-[9px] sm:text-base">
                  مرحبًا بك في SeenJeem
                </p>

                <h1 className="mt-1.5 font-black leading-[1.08] text-white sm:mt-3 sm:text-4xl lg:text-5xl">
                  <span className="block text-[1.28rem] max-[390px]:text-[1.16rem] sm:hidden">
                   لعبة تحدي جماعية
                    <br />
                    تفاعلية و حماسية
                    <br />
                    ممتعة وسريعة
                  </span>
                  <span className="hidden sm:block">
                    لعبة تحدي جماعية , تفاعلية وحماسية ممتعة وسريعة
                  </span>
                </h1>

                <p className="mt-2 text-[10px] leading-5 text-slate-300 max-[390px]:text-[9px] sm:mt-4 sm:text-lg sm:leading-8">
                  <span className="sm:hidden">
                    منصة عربية تساعدك على تشغيل ألعاب الأسئلة بين فريقين بواجهة
                    أنيقة، تنظيم واضح، وتجربة جاهزة للعرض أمام الجمهور في المدارس
                    والفعاليات والمناسبات الخاصة.
                  </span>
                  <span className="hidden sm:inline">
                    منصة عربية تساعدك على تشغيل ألعاب الأسئلة بين فريقين بواجهة
                    أنيقة، تنظيم واضح، وتجربة جاهزة للعرض أمام الجمهور في المدارس
                    والفعاليات والمناسبات الخاصة.
                  </span>
                </p>
              </div>

              <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
                <InfoStat title="" value="بدء فوري" />
                <InfoStat title="" value="فريقان" />
                <InfoStat title="" value="متابعة لاحقًا" />
              </div>

              <div className="rounded-[1.2rem] border border-white/10 bg-white/5 p-2.5 backdrop-blur sm:rounded-[1.75rem] sm:p-5">
                {loading ? (
                  <div className="flex flex-col gap-3">
                    <p className="text-xs text-slate-300 sm:text-base">
                      جارٍ تحميل بيانات الحساب...
                    </p>
                    <div className="h-10 w-full rounded-2xl bg-white/10 sm:h-11 sm:max-w-xs" />
                  </div>
                ) : isLoggedIn ? (
                  <div className="flex flex-col gap-2.5 sm:gap-4">
                    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-[10px] text-slate-300 max-[390px]:text-[9px] sm:text-sm">
                          أهلاً {username || "بك"}
                        </p>
                        <p className="mt-1 text-[1rem] font-bold leading-tight text-white max-[390px]:text-[0.92rem] sm:text-xl">
                          عدد الألعاب المتبقية: {gamesRemaining}
                        </p>
                        <p className="mt-1 text-[9px] leading-4 text-slate-400 max-[390px]:text-[8px] sm:text-sm sm:leading-6">
                          ابدأ جولة جديدة أو تابع ألعابك من صفحة الحساب.
                        </p>
                      </div>

                      <span className="w-fit rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 text-[8px] text-emerald-200 max-[390px]:text-[7px] sm:px-3 sm:py-2 sm:text-sm">
                        حسابك جاهز للعب
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-row sm:gap-3">
                      <Link
                        href="/game/start"
                        className="inline-flex min-h-8.5 items-center justify-center rounded-[0.95rem] bg-cyan-400 px-2 py-2 text-[10px] font-bold text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-300 max-[390px]:text-[9px] sm:min-h-12 sm:rounded-2xl sm:px-5 sm:py-3 sm:text-base"
                      >
                        <span className="sm:hidden">ابدأ الآن</span>
                        <span className="hidden sm:inline">ابدأ الآن</span>
                      </Link>
                      <Link
                        href="/account"
                        className="inline-flex min-h-8.5 items-center justify-center rounded-[0.95rem] border border-white/15 bg-white/5 px-2 py-2 text-[10px] font-bold text-white transition hover:bg-white/10 max-[390px]:text-[9px] sm:min-h-12 sm:rounded-2xl sm:px-5 sm:py-3 sm:text-base"
                      >
                        حسابي
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5 sm:gap-4">
                    <div>
                      <p className="text-[0.98rem] font-bold text-white max-[390px]:text-[0.9rem] sm:text-xl">
                        جاهز لبدء أول تحدٍّ؟
                      </p>
                      <p className="mt-2 text-[10px] leading-5 text-slate-300 max-[390px]:text-[9px] sm:text-base sm:leading-7">
                        أنشئ حسابك وابدأ في تجهيز ألعاب أسئلة عربية بتجربة أنيقة
                        وسهلة الاستخدام تناسب مختلف أنواع المسابقات.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-row sm:gap-3">
                      <Link
                        href="/register"
                        className="inline-flex min-h-8.5 items-center justify-center rounded-[0.95rem] bg-cyan-400 px-2 py-2 text-[10px] font-bold text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-300 max-[390px]:text-[9px] sm:min-h-12 sm:rounded-2xl sm:px-5 sm:py-3 sm:text-base"
                      >
                        إنشاء حساب
                      </Link>
                      <Link
                        href="/login"
                        className="inline-flex min-h-8.5 items-center justify-center rounded-[0.95rem] border border-white/15 bg-white/5 px-2 py-2 text-[10px] font-bold text-white transition hover:bg-white/10 max-[390px]:text-[9px] sm:min-h-12 sm:rounded-2xl sm:px-5 sm:py-3 sm:text-base"
                      >
                        تسجيل الدخول
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="min-w-0">
              <div className="rounded-[1.15rem] border border-white/10 bg-white/5 p-1.5 shadow-xl shadow-slate-950/30 backdrop-blur max-[390px]:rounded-[1.05rem] sm:rounded-[2rem] sm:p-5">
                <div className="rounded-[1rem] border border-white/10 bg-slate-950/80 p-2 sm:rounded-[1.5rem] sm:p-5">
                  <div className="flex flex-col gap-2 border-b border-white/10 pb-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:pb-4">
                    <div className="min-w-0">
                      <p className="text-[9px] text-slate-400 sm:text-sm">
                        معاينة سريعة
                      </p>
                      <h2 className="mt-1 text-[0.95rem] font-bold leading-tight text-white max-[390px]:text-[0.88rem] sm:text-2xl">
                        لوحة لعبة جاهزة
                      </h2>
                    </div>

                    <span className="w-fit rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-1 text-[8px] font-medium leading-none text-cyan-200 sm:px-3 sm:text-xs">
                      <span className="sm:hidden">تجربة واضحة</span>
                      <span className="hidden sm:inline">تجربة منظمة وواضحة</span>
                    </span>
                  </div>

                  <div className="mt-2.5 grid grid-cols-2 gap-1.5 sm:mt-5 sm:gap-4">
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

                  <div className="mt-2.5 grid grid-cols-2 gap-1.5 sm:mt-4 sm:gap-3">
                    <PreviewCategory label="رياضة" points="100 • 200 • 300" />
                    <PreviewCategory label="تاريخ" points="100 • 200 • 300" />
                    <PreviewCategory label="جغرافيا" points="100 • 200 • 300" />
                    <PreviewCategory label="ثقافة عامة" points="100 • 200 • 300" />
                  </div>

                  <div className="mt-2.5 rounded-[1rem] border border-white/10 bg-white/[0.03] p-2.5 sm:mt-4 sm:rounded-2xl sm:p-4">
                    <p className="text-[9px] text-slate-400 sm:text-sm">
                      تجربة مناسبة للعرض
                    </p>
                    <p className="mt-1.5 text-[9px] leading-4.5 text-slate-300 max-[390px]:text-[8.5px] sm:mt-2 sm:text-sm sm:leading-7">
                      <span className="sm:hidden">
                        واجهة واضحة مناسبة للعرض داخل الصفوف والفعاليات والمناسبات.
                      </span>
                      <span className="hidden sm:inline">
                        واجهة مرتبة تساعد على تقديم اللعبة بشكل جذاب وواضح سواء
                        داخل الفصول أو في الفعاليات والمناسبات المختلفة.
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </section>

        <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] px-3 py-4 sm:rounded-[2rem] sm:px-8 sm:py-8 lg:px-10 lg:py-10">
          <SectionHeader
            eyebrow="كيف تعمل المنصة"
            title="ثلاث خطوات بسيطة للانطلاق"
            description="ابدأ اللعبة بسرعة، انتقل بين الأسئلة بسهولة، واحتفظ بتقدمك لتكمل الجولة في الوقت المناسب."
          />

          <div className="mt-4 grid grid-cols-3 gap-3 sm:mt-8 sm:gap-4">
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

        <section className="rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.03] px-3 py-4 sm:rounded-[2rem] sm:px-8 sm:py-8 lg:px-10 lg:py-10">
          <SectionHeader
            eyebrow="استخدامات المنصة"
            title="مناسبة لعدة سيناريوهات"
            description="سواء كنت تدير مسابقة مدرسية أو فعالية جماهيرية أو لقاءً خاصًا، تمنحك SeenJeem تجربة منظمة وسهلة التقديم."
          />

          <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4 xl:grid-cols-4">
            {audiences.map((item) => (
              <AudienceCard
                key={item.title}
                title={item.title}
                description={item.description}
              />
            ))}
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] px-3 py-4 sm:rounded-[2rem] sm:px-8 sm:py-8 lg:px-10 lg:py-10">
          <SectionHeader
            eyebrow="الأسئلة الشائعة"
            title="كل ما تحتاج معرفته قبل البدء"
            description="إجابات مختصرة وواضحة تساعد الزائر على فهم طبيعة المنصة وطريقة استخدامها بسرعة."
          />

          <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4">
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

        <section className="rounded-[1.75rem] border border-cyan-400/20 bg-gradient-to-br from-cyan-400/10 via-slate-900 to-orange-500/10 px-3 py-4 sm:rounded-[2rem] sm:px-8 sm:py-8 lg:px-10 lg:py-10">
          <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-medium text-cyan-300 sm:text-sm">
                ابدأ الآن
              </p>
              <h2 className="mt-2 text-xl font-black text-white sm:text-3xl">
                اجعل المسابقات أكثر تفاعلًا وتنظيمًا
              </h2>
              <p className="mt-3 text-xs leading-6 text-slate-300 sm:text-base sm:leading-8">
                ابدأ لعبة جديدة خلال لحظات واستمتع بتجربة عربية أنيقة مناسبة
                للعرض، الإدارة، والمتابعة بسهولة.
              </p>
            </div>

            {loading ? (
              <div className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-slate-300 sm:min-h-12 sm:px-5 sm:py-3 sm:text-sm">
                جارٍ تحميل بيانات الحساب...
              </div>
            ) : isLoggedIn ? (
              <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:gap-3">
                <Link
                  href="/game/start"
                  className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-cyan-400 px-3 py-2.5 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-300 sm:min-h-12 sm:px-5 sm:py-3 sm:text-base"
                >
                  ابدأ لعبة جديدة
                </Link>
                <Link
                  href="/account"
                  className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-white/10 sm:min-h-12 sm:px-5 sm:py-3 sm:text-base"
                >
                  انتقل إلى حسابي
                </Link>
              </div>
            ) : (
              <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:gap-3">
                <Link
                  href="/register"
                  className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-cyan-400 px-3 py-2.5 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-300 sm:min-h-12 sm:px-5 sm:py-3 sm:text-base"
                >
                  أنشئ حسابك
                </Link>
                <Link
                  href="/login"
                  className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-white/10 sm:min-h-12 sm:px-5 sm:py-3 sm:text-base"
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
      <p className="text-[11px] font-medium text-cyan-300 sm:text-sm">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-xl font-black text-white sm:text-3xl">
        {title}
      </h2>
      <p className="mt-3 text-xs leading-6 text-slate-300 sm:text-base sm:leading-8">
        {description}
      </p>
    </div>
  );
}

function InfoStat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-white/10 bg-white/5 px-2 py-2.5 backdrop-blur sm:rounded-[1.5rem] sm:px-4 sm:py-4">
      <p className="text-[8px] text-slate-400 max-[390px]:text-[7px] sm:text-sm">
        {title}
      </p>
      <p className="mt-1 text-[10px] font-bold leading-tight text-white max-[390px]:text-[9px] sm:mt-2 sm:text-lg">
        {value}
      </p>
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
    <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-3 transition hover:-translate-y-1 hover:bg-white/[0.06] sm:rounded-[1.75rem] sm:p-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-300 sm:h-11 sm:w-11">
        <span className="text-sm font-bold sm:text-lg">✓</span>
      </div>
      <h3 className="mt-3 text-sm font-bold text-white sm:mt-4 sm:text-xl">
        {title}
      </h3>
      <p className="mt-2 text-[11px] leading-5 text-slate-300 sm:mt-3 sm:text-base sm:leading-7">
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
    <div className="rounded-[1.4rem] border border-white/10 bg-slate-950/60 p-3 sm:rounded-[1.75rem] sm:p-5">
      <div className="inline-flex rounded-full border border-orange-400/30 bg-orange-400/10 px-2.5 py-1 text-[10px] font-bold text-orange-200 sm:px-3 sm:text-sm">
        {number}
      </div>
      <h3 className="mt-3 text-sm font-bold text-white sm:mt-4 sm:text-xl">
        {title}
      </h3>
      <p className="mt-2 text-[11px] leading-5 text-slate-300 sm:mt-3 sm:text-base sm:leading-7">
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
    <div className="rounded-[1.4rem] border border-white/10 bg-slate-950/50 p-3 sm:rounded-[1.75rem] sm:p-5">
      <h3 className="text-sm font-bold text-white sm:text-lg">{title}</h3>
      <p className="mt-2 text-[11px] leading-5 text-slate-300 sm:mt-3 sm:text-base sm:leading-7">
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
    <div className="overflow-hidden rounded-[0.95rem] border border-white/10 bg-white/[0.03] p-2 max-[390px]:p-1.5 sm:rounded-[1.5rem] sm:p-4">
      <div className="flex items-center justify-between gap-1.5">
        <p className="min-w-0 text-[8px] font-medium leading-4 text-slate-300 max-[390px]:text-[7.5px] sm:text-sm">
          {teamName}
        </p>
        <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-[7px] text-slate-300 max-[390px]:text-[6.5px] sm:px-3 sm:py-1 sm:text-xs">
          نقاط
        </span>
      </div>

      <p className="mt-2.5 text-[1.05rem] font-black leading-none tracking-tight text-white max-[390px]:text-[0.95rem] sm:mt-3 sm:text-3xl">
        {score}
      </p>

      <p className="mt-1.5 text-[8px] leading-4 text-slate-300 max-[390px]:text-[7.5px] sm:mt-3 sm:text-sm sm:leading-6">
        {hint}
      </p>
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
    <div className="rounded-[0.9rem] border border-white/10 bg-white/[0.03] p-2 max-[390px]:p-1.5 sm:rounded-2xl sm:p-4">
      <p className="text-[8px] font-semibold leading-4 text-white max-[390px]:text-[7.5px] sm:text-sm">
        {label}
      </p>
      <p className="mt-1 text-[7.5px] leading-4 tracking-tight text-slate-400 max-[390px]:text-[7px] sm:mt-2 sm:text-sm">
        {points}
      </p>
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
    <div className="rounded-[1.4rem] border border-white/10 bg-slate-950/60 p-3 sm:rounded-[1.75rem] sm:p-5">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-start justify-between gap-2 text-right sm:gap-4"
      >
        <span className="text-xs font-bold leading-6 text-white sm:text-lg sm:leading-8">
          {item.question}
        </span>
        <span
          className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition sm:mt-1 sm:h-10 sm:w-10 sm:rounded-2xl ${
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
            className={`h-4 w-4 transition-transform sm:h-5 sm:w-5 ${
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
        <div className="mt-3 border-t border-white/10 pt-3 sm:mt-4 sm:pt-4">
          <p className="text-[11px] leading-6 text-slate-300 sm:text-base sm:leading-8">
            {item.answer}
          </p>
        </div>
      ) : null}
    </div>
  );
}