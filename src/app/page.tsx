import Container from "@/components/ui/container";
import SectionTitle from "@/components/ui/section-title";

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_25%)]" />
      <Container className="grid min-h-[calc(100vh-80px)] items-center gap-12 py-20 md:grid-cols-2">
        <div>
          <span className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-300">
            منصة ألعاب أسئلة عربية احترافية
          </span>

          <h1 className="mt-6 text-5xl font-black leading-tight md:text-7xl">
            ابنِ تجربة لعب
            <span className="block text-cyan-400">أقوى، أسرع، وأذكى</span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 md:text-xl">
            منصة متكاملة للألعاب الجماعية والأسئلة التنافسية، تشمل واجهة مستخدم
            حديثة، نظام حسابات، خصم رصيد لكل لعبة، ولوحة تحكم كاملة لإدارة
            الفئات والأسئلة والمستخدمين.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="/game/start"
              className="rounded-2xl bg-cyan-400 px-6 py-3 font-bold text-slate-950 transition hover:opacity-90"
            >
              ابدأ المشروع
            </a>
            <a
              href="/pricing"
              className="rounded-2xl border border-white/15 px-6 py-3 font-bold transition hover:bg-white/5"
            >
              شاهد الباقات
            </a>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-center">
              <div className="text-3xl font-black text-cyan-400">36</div>
              <div className="mt-2 text-sm text-slate-300">سؤال لكل لعبة</div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-center">
              <div className="text-3xl font-black text-cyan-400">6</div>
              <div className="mt-2 text-sm text-slate-300">فئات أساسية</div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-center">
              <div className="text-3xl font-black text-cyan-400">3</div>
              <div className="mt-2 text-sm text-slate-300">وسائل مساعدة</div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-center">
              <div className="text-3xl font-black text-cyan-400">∞</div>
              <div className="mt-2 text-sm text-slate-300">قابلية توسعة</div>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-400">إعداد لعبة جديدة</div>
              <div className="text-2xl font-black">اختر الفئات</div>
            </div>

            <div className="rounded-full bg-cyan-400/15 px-3 py-1 text-sm text-cyan-300">
              الخطوة 1 من 3
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {["تاريخ", "رياضة", "جغرافيا", "أفلام", "أغاني", "معلومات عامة"].map(
              (item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-4 text-center text-sm font-semibold text-slate-200 transition hover:border-cyan-400/40 hover:bg-cyan-400/10"
                >
                  {item}
                </div>
              ),
            )}
          </div>

          <a
            href="/game/start"
            className="mt-5 block w-full rounded-2xl bg-cyan-400 px-4 py-3 text-center font-bold text-slate-950 transition hover:opacity-90"
          >
            ابدأ لعبة جديدة
          </a>
        </div>
      </Container>
    </section>
  );
}

function Features() {
  const items = [
    {
      title: "نظام لعب متكامل",
      text: "بدء جلسات، أسئلة، نتائج، وحساب النقاط بشكل منظم وقابل للتوسع.",
    },
    {
      title: "لوحة تحكم كاملة",
      text: "إدارة الفئات والأسئلة والمستخدمين والباقات والرصيد من مكان واحد.",
    },
    {
      title: "نظام رصيد وألعاب",
      text: "كل لعبة تخصم من رصيد المستخدم مع سجل واضح للحركات.",
    },
  ];

  return (
    <section className="py-20">
      <Container>
        <SectionTitle
          eyebrow="المميزات"
          title="بنية قوية من البداية"
          description="نبني المشروع كمنصة حقيقية جاهزة للإطلاق، وليس مجرد صفحات تجريبية."
        />

        <div className="grid gap-6 md:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.title}
              className="rounded-[2rem] border border-white/10 bg-white/5 p-6"
            >
              <h3 className="text-2xl font-black">{item.title}</h3>
              <p className="mt-4 leading-8 text-slate-300">{item.text}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    "يسجل المستخدم ويمتلك رصيد ألعاب",
    "يبدأ لعبة جديدة ويتم خصم لعبة أو نقطة",
    "تُجلب الأسئلة حسب الفئات المحددة",
    "تنتهي اللعبة وتُحفظ النتيجة في السجل",
  ];

  return (
    <section className="bg-white/5 py-20">
      <Container>
        <SectionTitle eyebrow="كيف تعمل" title="تدفق لعب واضح" />

        <div className="grid gap-6 md:grid-cols-4">
          {steps.map((step, index) => (
            <div
              key={step}
              className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/15 text-lg font-black text-cyan-300">
                {index + 1}
              </div>
              <p className="text-lg font-semibold leading-8 text-slate-200">
                {step}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function Plans() {
  return (
    <section className="py-20">
      <Container>
        <SectionTitle
          eyebrow="الباقات"
          title="هيكل جاهز للباقات والاشتراكات"
        />

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <h3 className="text-2xl font-black">تجريبية</h3>
            <p className="mt-3 text-slate-300">للبداية واختبار المنتج.</p>
            <div className="mt-6 text-4xl font-black text-cyan-400">0</div>
          </div>

          <div className="rounded-[2rem] border border-cyan-400/40 bg-cyan-400/10 p-6">
            <h3 className="text-2xl font-black">بريميوم</h3>
            <p className="mt-3 text-slate-200">عدد ألعاب أكبر ومزايا أوسع.</p>
            <div className="mt-6 text-4xl font-black text-cyan-300">9.9</div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <h3 className="text-2xl font-black">شركات</h3>
            <p className="mt-3 text-slate-300">حلول مخصصة للجهات والمناسبات.</p>
            <div className="mt-6 text-4xl font-black text-cyan-400">مخصص</div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function AdminSection() {
  return (
    <section className="pb-24">
      <Container>
        <div className="rounded-[2rem] border border-white/10 bg-gradient-to-r from-cyan-400/20 to-blue-500/10 p-8">
          <h2 className="text-4xl font-black">لوحة تحكم شاملة</h2>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-200">
            إدارة الفئات، الأسئلة، المستخدمين، الأرصدة، والباقات من لوحة مركزية
            واحدة مبنية بطريقة احترافية وقابلة للتوسع.
          </p>

          <div className="mt-6 flex flex-wrap gap-4">
            <a
              href="/admin"
              className="rounded-2xl bg-cyan-400 px-6 py-3 font-bold text-slate-950 transition hover:opacity-90"
            >
              ابدأ التنفيذ
            </a>
            <a
              href="/dashboard"
              className="rounded-2xl border border-white/15 px-6 py-3 font-bold transition hover:bg-white/5"
            >
              استعراض الهيكل
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Hero />
      <Features />
      <HowItWorks />
      <Plans />
      <AdminSection />
    </main>
  );
}