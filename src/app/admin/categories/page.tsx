import AdminEmptyState from "@/components/admin/admin-empty-state";
import AdminPageHeader from "@/components/admin/admin-page-header";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
};

export default async function AdminCategoriesPage() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  const categories = (data ?? []) as Category[];

  if (error) {
    return (
      <div className="space-y-8">
        <AdminPageHeader
          title="إدارة الفئات"
          description="حدث خطأ أثناء جلب البيانات من قاعدة البيانات."
        />

        <div className="rounded-[2rem] border border-red-500/20 bg-red-500/10 p-6 text-red-200">
          فشل تحميل الفئات من Supabase: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="إدارة الفئات"
        description="من هنا ستضيف الفئات وتعدّلها وتحذفها لاحقًا."
        action={
          <a
            href="/admin/categories/new"
            className="rounded-2xl bg-cyan-400 px-5 py-3 font-bold text-slate-950"
          >
            إضافة فئة جديدة
          </a>
        }
      />

      <div className="rounded-[2rem] border border-white/10 bg-white/5 p-4">
        <div className="grid gap-4 md:grid-cols-[1fr_220px]">
          <input
            type="text"
            placeholder="ابحث عن فئة..."
            className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
          />
          <select className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none">
            <option>كل الحالات</option>
            <option>مفعلة</option>
            <option>غير مفعلة</option>
          </select>
        </div>
      </div>

      {categories.length > 0 ? (
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5">
          <div className="grid grid-cols-4 border-b border-white/10 bg-slate-900/60 px-6 py-4 font-bold text-slate-200">
            <div>اسم الفئة</div>
            <div>Slug</div>
            <div>الترتيب</div>
            <div>الحالة</div>
          </div>

          {categories.map((category) => (
            <div
              key={category.id}
              className="grid grid-cols-4 border-b border-white/10 px-6 py-4 text-slate-300 last:border-b-0"
            >
              <div>{category.name}</div>
              <div>{category.slug}</div>
              <div>{category.sort_order}</div>
              <div>{category.is_active ? "مفعلة" : "غير مفعلة"}</div>
            </div>
          ))}
        </div>
      ) : (
        <AdminEmptyState
          title="لا توجد فئات بعد"
          description="ابدأ بإضافة أول فئة حتى يتمكن النظام من تنظيم الأسئلة وربطها باللعبة."
          buttonText="إضافة أول فئة"
        />
      )}
    </div>
  );
}