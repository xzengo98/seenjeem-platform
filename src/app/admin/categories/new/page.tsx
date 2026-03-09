import AdminPageHeader from "@/components/admin/admin-page-header";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Section = {
  id: string;
  name: string;
  slug: string;
};

async function createCategory(formData: FormData) {
  "use server";

  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const imageUrl = String(formData.get("image_url") ?? "").trim();
  const sectionId = String(formData.get("section_id") ?? "").trim();
  const sortOrder = Number(formData.get("sort_order") ?? 0);
  const isActive = formData.get("is_active") === "on";

  if (!name || !slug) {
    throw new Error("اسم الفئة و slug مطلوبان.");
  }

  const supabase = await getSupabaseServerClient();

  const { error } = await supabase.from("categories").insert({
    name,
    slug,
    description: description || null,
    image_url: imageUrl || null,
    section_id: sectionId || null,
    sort_order: Number.isNaN(sortOrder) ? 0 : sortOrder,
    is_active: isActive,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/categories");
  revalidatePath("/game/start");
  redirect("/admin/categories");
}

export default async function NewCategoryPage() {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("category_sections")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    return (
      <div className="space-y-8">
        <AdminPageHeader
          title="إضافة فئة جديدة"
          description="حدث خطأ أثناء جلب الأقسام الرئيسية."
        />

        <div className="rounded-[2rem] border border-red-500/20 bg-red-500/10 p-6 text-red-200">
          فشل تحميل الأقسام: {error.message}
        </div>
      </div>
    );
  }

  const sections = (data ?? []) as Section[];

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="إضافة فئة جديدة"
        description="أضف فئة جديدة وحدد القسم الرئيسي والصورة والوصف والترتيب."
        action={
          <a
            href="/admin/categories"
            className="rounded-2xl border border-white/10 px-5 py-3 font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white"
          >
            الرجوع للفئات
          </a>
        }
      />

      <form
        action={createCategory}
        className="rounded-[2rem] border border-white/10 bg-white/5 p-6"
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-200">
              اسم الفئة
            </label>
            <input
              name="name"
              placeholder="مثال: تاريخ"
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-200">
              Slug
            </label>
            <input
              name="slug"
              placeholder="مثال: history"
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-200">
              القسم الرئيسي
            </label>
            <select
              name="section_id"
              defaultValue=""
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
            >
              <option value="">بدون قسم</option>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.name} ({section.slug})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-200">
              رابط الصورة
            </label>
            <input
              name="image_url"
              placeholder="/category-images/history.png"
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-bold text-slate-200">
              الوصف
            </label>
            <textarea
              name="description"
              placeholder="وصف مختصر عن الفئة"
              rows={4}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-200">
              الترتيب
            </label>
            <input
              name="sort_order"
              type="number"
              defaultValue={0}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-8">
            <input
              id="is_active"
              name="is_active"
              type="checkbox"
              defaultChecked
              className="h-5 w-5"
            />
            <label
              htmlFor="is_active"
              className="text-sm font-semibold text-slate-200"
            >
              الفئة مفعّلة
            </label>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          <button
            type="submit"
            className="rounded-2xl bg-cyan-400 px-6 py-3 font-bold text-slate-950"
          >
            حفظ الفئة
          </button>

          <a
            href="/admin/categories"
            className="rounded-2xl border border-white/10 px-6 py-3 font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white"
          >
            إلغاء
          </a>
        </div>
      </form>
    </div>
  );
}