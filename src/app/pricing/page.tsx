import Link from "next/link";

type PlanFeature = {
  label: string;
  included: boolean;
};

type Plan = {
  name: string;
  badge: string;
  description: string;
  price: string;
  note: string;
  highlight?: boolean;
  buttonLabel: string;
  buttonHref: string;
  features: PlanFeature[];
};

const plans: Plan[] = [
  {
    name: "FREE",
    badge: "للبداية",
    description:
      "مناسبة لتجربة المنصة والتعرّف على طريقة اللعب والإدارة قبل التوسع.",
    price: "مجاني",
    note: "مثالية للتجربة الأولى",
    buttonLabel: "ابدأ مجانًا",
    buttonHref: "/register",
    features: [
      { label: "عدد محدود من الألعاب", included: true },
      { label: "إنشاء جولات أساسية", included: true },
      { label: "إدارة الفئات والأسئلة", included: true },
      { label: "حفظ ألعاب أكثر من المستوى المجاني", included: false },
      { label: "أولوية أعلى في الاستخدام", included: false },
      { label: "مزايا احترافية إضافية", included: false },
    ],
  },
  {
    name: "Premium",
    badge: "الأكثر توازنًا",
    description:
      "مناسبة لمن يحتاج عدد ألعاب أكبر وتجربة أكثر مرونة للمسابقات المتكررة.",
    price: "سعر مرن",
    note: "الخيار الأنسب لمعظم المستخدمين",
    highlight: true,
    buttonLabel: "اختيار Premium",
    buttonHref: "/register",
    features: [
      { label: "عدد ألعاب أكبر", included: true },
      { label: "تجربة استخدام أكثر مرونة", included: true },
      { label: "الوصول إلى مزايا إضافية", included: true },
      { label: "تنظيم أفضل للمحتوى والجولات", included: true },
      { label: "أولوية أعلى من الخطة المجانية", included: true },
      { label: "مناسب للاستخدام المتكرر", included: true },
    ],
  },
  {
    name: "VIP",
    badge: "للاستخدام المكثف",
    description:
      "موجهة للجهات أو المستخدمين الذين يحتاجون مرونة أعلى وتجربة أكثر تميزًا.",
    price: "سعر مخصص",
    note: "مناسبة للفعاليات والاستخدام المتقدم",
    buttonLabel: "اختيار VIP",
    buttonHref: "/register",
    features: [
      { label: "أعلى عدد من الألعاب", included: true },
      { label: "أفضل مرونة في الاستخدام", included: true },
      { label: "أولوية أعلى في التوسع لاحقًا", included: true },
      { label: "مناسبة للجهات والفرق الكبيرة", included: true },
      { label: "جاهزة للتخصيص المستقبلي", included: true },
      { label: "أفضل باقة للمسابقات المتكررة", included: true },
    ],
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

function CrossIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path
        d="M18 6 6 18M6 6l12 12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  return (
    <div
      className={[
        "relative rounded-[2rem] border p-5 sm:p-6",
        plan.highlight
          ? "border-cyan-400/30 bg-[linear-gradient(180deg,rgba(34,211,238,0.12),rgba(15,23,42,0.92))] shadow-[0_20px_80px_rgba(34,211,238,0.12)]"
          : "border-white/10 bg-white/5",
      ].join(" ")}
    >
      {plan.highlight ? (
        <span className="absolute -top-3 right-5 rounded-full bg-cyan-400 px-4 py-2 text-xs font-black text-slate-950 shadow-lg">
          موصى بها
        </span>
      ) : null}

      <div className="flex items-start justify-between gap-3">
        <div>
          <span
            className={[
              "inline-flex rounded-full px-3 py-1.5 text-xs font-bold",
              plan.highlight
                ? "bg-cyan-400/15 text-cyan-200"
                : "border border-white/10 bg-white/5 text-slate-200",
            ].join(" ")}
          >
            {plan.badge}
          </span>

          <h2 className="mt-4 text-3xl font-black text-white">{plan.name}</h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            {plan.description}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-center">
          <p className="text-xs text-slate-400">السعر</p>
          <p className="mt-2 text-lg font-black text-white">{plan.price}</p>
        </div>
      </div>

      <div className="mt-5 rounded-[1.25rem] border border-white/10 bg-slate-950/50 p-4">
        <p className="text-sm font-bold text-cyan-300">{plan.note}</p>
      </div>

      <ul className="mt-6 space-y-3">
        {plan.features.map((feature) => (
          <li
            key={feature.label}
            className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
          >
            <span
              className={[
                "mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                feature.included
                  ? "bg-emerald-400/15 text-emerald-300"
                  : "bg-white/5 text-slate-500",
              ].join(" ")}
            >
              {feature.included ? <CheckIcon /> : <CrossIcon />}
            </span>
            <span
              className={feature.included ? "text-white" : "text-slate-500 line-through"}
            >
              {feature.label}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-6">
        <Link
          href={plan.buttonHref}
          className={[
            "inline-flex min-h-12 w-full items-center justify-center rounded-2xl px-6 py-3 text-base font-black transition",
            plan.highlight
              ? "bg-cyan-400 text-slate-950 hover:bg-cyan-300"
              : "border border-white/10 bg-white/5 text-white hover:bg-white/10",
          ].join(" ")}
        >
          {plan.buttonLabel}
        </Link>
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <section className="overflow-hidden rounded-[2.25rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.15),transparent_25%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.10),transparent_22%),linear-gradient(135deg,#020617_0%,#08122f_48%,#020617_100%)] p-6 sm:p-8">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-bold text-cyan-200 sm:text-sm">
              الباقات
            </span>
            <h1 className="mt-4 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
              اختر الباقة الأنسب
              <span className="block text-cyan-300">لطريقة استخدامك</span>
            </h1>
            <p className="mt-5 text-sm leading-8 text-slate-300 sm:text-base">
              جهزنا لك ثلاث مستويات واضحة: FREE و Premium و VIP.
              يمكنك تعديل الأسعار والمزايا لاحقًا بسهولة، لكن الصفحة الآن صارت
              جاهزة للعرض بشكل احترافي ومرتب.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-cyan-400 px-6 py-3 text-base font-black text-slate-950 transition hover:bg-cyan-300"
              >
                ابدأ الآن
              </Link>
              <Link
                href="/game/start"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-base font-bold text-white transition hover:bg-white/10"
              >
                جرّب المنصة
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard key={plan.name} plan={plan} />
          ))}
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5 sm:p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.5rem] border border-white/10 bg-slate-900/60 p-5">
              <h3 className="text-lg font-black text-white">FREE</h3>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                للدخول السريع وتجربة المنصة والتعرّف على طريقة الإدارة واللعب.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-cyan-400/20 bg-cyan-400/10 p-5">
              <h3 className="text-lg font-black text-white">Premium</h3>
              <p className="mt-2 text-sm leading-7 text-cyan-100">
                للمستخدمين الذين يحتاجون ألعابًا أكثر وتجربة أكثر مرونة واستمرارية.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-slate-900/60 p-5">
              <h3 className="text-lg font-black text-white">VIP</h3>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                للاستخدام المكثف والفعاليات المتقدمة والجهات التي تحتاج مرونة أعلى.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}