import AdminPageHeader from "@/components/admin/admin-page-header";
import AdminStatCard from "@/components/admin/admin-stat-card";

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
      <AdminPageHeader
        title="نظرة عامة"
        description="هذه الصفحة ستكون المدخل الرئيسي لإدارة المنصة بالكامل، وتتوسع لاحقًا إلى أقسام منفصلة لكل جزء من النظام."
      />

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <AdminStatCard
            key={card.title}
            label={card.title}
            value={card.value}
          />
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