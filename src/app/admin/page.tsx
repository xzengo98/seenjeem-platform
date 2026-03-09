import AdminPageHeader from "@/components/admin/admin-page-header";
import AdminStatCard from "@/components/admin/admin-stat-card";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = getSupabaseServerClient();

  const [
    sectionsResult,
    categoriesResult,
    activeCategoriesResult,
    questionsResult,
  ] = await Promise.all([
    supabase
      .from("category_sections")
      .select("*", { count: "exact", head: true }),
    supabase.from("categories").select("*", { count: "exact", head: true }),
    supabase
      .from("categories")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),
    supabase.from("questions").select("*", { count: "exact", head: true }),
  ]);

  const sectionsCount = sectionsResult.count ?? 0;
  const categoriesCount = categoriesResult.count ?? 0;
  const activeCategoriesCount = activeCategoriesResult.count ?? 0;
  const questionsCount = questionsResult.count ?? 0;

  const quickLinks = [
    { label: "إدارة الأقسام الرئيسية", href: "/admin/sections" },
    { label: "إضافة قسم جديد", href: "/admin/sections/new" },
    { label: "إدارة الفئات", href: "/admin/categories" },
    { label: "إضافة فئة جديدة", href: "/admin/categories/new" },
    { label: "إدارة الأسئلة", href: "/admin/questions" },
    { label: "إضافة سؤال جديد", href: "/admin/questions/new" },
  ];

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="نظرة عامة"
        description="هذه الصفحة أصبحت مركز الإدارة الفعلي للأقسام الرئيسية والفئات والأسئلة وتجهيز بنية اللعبة قبل الانتقال إلى حفظ الجلسات والنقاط."
      />

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="إجمالي الأقسام الرئيسية" value={String(sectionsCount)} />
        <AdminStatCard label="إجمالي الفئات" value={String(categoriesCount)} />
        <AdminStatCard label="الفئات المفعّلة" value={String(activeCategoriesCount)} />
        <AdminStatCard label="إجمالي الأسئلة" value={String(questionsCount)} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <h3 className="text-2xl font-black">إجراءات سريعة</h3>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {quickLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-4 font-semibold text-slate-200 transition hover:bg-white/5 hover:text-white"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <h3 className="text-2xl font-black">ملخص النظام</h3>

          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <div className="text-sm text-slate-400">حالة المشروع</div>
              <div className="mt-2 text-lg font-bold text-cyan-300">
                لوحة الإدارة جاهزة مبدئيًا
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <div className="text-sm text-slate-400">ربط قاعدة البيانات</div>
              <div className="mt-2 text-lg font-bold text-slate-200">
                Supabase مرتبط ويعمل
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <div className="text-sm text-slate-400">المرحلة القادمة</div>
              <div className="mt-2 text-lg font-bold text-slate-200">
                حفظ الجلسات والنقاط والنتائج
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}