const cards = [
  { title: "إجمالي المستخدمين", value: "124" },
  { title: "إجمالي الأسئلة", value: "860" },
  { title: "إجمالي الفئات", value: "18" },
  { title: "الجلسات اليوم", value: "32" },
];

const quickLinks = [
  "إدارة الفئات",
  "إضافة سؤال جديد",
  "مراجعة المستخدمين",
  "إدارة الأرصدة",
  "إدارة الباقات",
  "سجل الجلسات",
];

export default function AdminPage() {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-3xl font-black">نظرة عامة</h2>
        <p className="mt-3 max-w-3xl text-slate-300">
          هذه الصفحة ستكون المدخل الرئيسي لإدارة المنصة بالكامل، وتتوسع لاحقًا
          إلى أقسام منفصلة لكل جزء من النظام.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-[2rem] border border-white/10 bg-white/5 p-6"
          >
            <div className="text-sm text-slate-400">{card.title}</div>
            <div className="mt-4 text-4xl font-black text-cyan-400">
              {card.value}
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <h3 className="text-2xl font-black">إجراءات سريعة</h3>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {quickLinks.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-4 font-semibold text-slate-200"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <h3 className="text-2xl font-black">ملخص النظام</h3>
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <div className="text-sm text-slate-400">حالة المشروع</div>
              <div className="mt-2 text-lg font-bold text-cyan-300">
                قيد البناء الاحترافي
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <div className="text-sm text-slate-400">ربط قاعدة البيانات</div>
              <div className="mt-2 text-lg font-bold text-slate-200">
                قريبًا عبر Supabase
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <div className="text-sm text-slate-400">نوع المنصة</div>
              <div className="mt-2 text-lg font-bold text-slate-200">
                Quiz Gaming Platform
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}