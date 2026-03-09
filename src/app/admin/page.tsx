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
        title="لوحة التحكم الرئيسية"
        description="إدارة الأقسام الرئيسية والفئات والأسئلة والمحتوى الأساسي للعبة من مكان واحد."
      />

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="إجمالي الأقسام الرئيسية" value={String(sectionsCount)} />
        <AdminStatCard label="إجمالي الفئات" value={String(categoriesCount)} />
        <AdminStatCard label="الفئات المفعّلة" value={String(activeCategoriesCount)} />
        <AdminStatCard label="إجمالي الأسئلة" value={String(questionsCount)} />
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
        <h3 className="text-2xl font-black">إجراءات سريعة</h3>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {quickLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-4 font-semibold text-slate-200 transition hover:bg-white/5 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}