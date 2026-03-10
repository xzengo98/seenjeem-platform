import Link from "next/link";
import AdminPageHeader from "@/components/admin/admin-page-header";
import AdminStatCard from "@/components/admin/admin-stat-card";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await getSupabaseServerClient();

  const [
    sectionsResult,
    categoriesResult,
    activeCategoriesResult,
    questionsResult,
  ] = await Promise.all([
    supabase.from("category_sections").select("*", { count: "exact", head: true }),
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
    { label: "رفع أسئلة بالجملة", href: "/admin/questions/import" },
    { label: "الأعضاء", href: "/admin/users" },
    { label: "الألعاب المنتهية", href: "/admin/games" },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="لوحة التحكم"
        description="إدارة شاملة للمحتوى الأساسي للعبة مع وصول سريع للأقسام والفئات والأسئلة ورفع الداتا بالجملة."
        action={
          <>
            <Link
              href="/admin/questions/import"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-orange-400/20 bg-orange-400/10 px-5 py-3 text-sm font-bold text-orange-100 transition hover:bg-orange-400/15"
            >
              رفع أسئلة بالجملة
            </Link>
            <Link
              href="/admin/questions/new"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-300"
            >
              إضافة سؤال جديد
            </Link>
          </>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="عدد الأقسام الرئيسية" value={String(sectionsCount)} />
        <AdminStatCard label="عدد الفئات" value={String(categoriesCount)} />
        <AdminStatCard
          label="الفئات المفعلة"
          value={String(activeCategoriesCount)}
        />
        <AdminStatCard label="عدد الأسئلة" value={String(questionsCount)} />
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 sm:p-6 lg:p-8">
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-cyan-300">إجراءات سريعة</p>
          <h3 className="mt-2 text-2xl font-black text-white sm:text-3xl">
            انتقل بسرعة إلى القسم المطلوب
          </h3>
          <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base sm:leading-8">
            تم ترتيب أهم الروابط في بطاقات واضحة لتسهيل الوصول إليها من الهاتف
            أو سطح المكتب.
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {quickLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-[1.5rem] border border-white/10 bg-slate-900/50 p-5 transition hover:-translate-y-0.5 hover:border-cyan-400/30 hover:bg-cyan-400/10"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-black text-white">{item.label}</p>
                  <p className="mt-2 text-sm text-slate-400">فتح الصفحة</p>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-cyan-300">
                  ←
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}