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

type PageProps = {
  params: Promise<{ id: string }>;
};

async function updateCategory(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const imageUrl = String(formData.get("image_url") ?? "").trim();
  const sectionId = String(formData.get("section_id") ?? "").trim();
  const sortOrder = Number(formData.get("sort_order") ?? 0);
  const isActive = formData.get("is_active") === "on";

  const supabase = await getSupabaseServerClient();

  await supabase
    .from("categories")
    .update({
      name,
      slug,
      description: description || null,
      image_url: imageUrl || null,
      section_id: sectionId || null,
      sort_order: Number.isNaN(sortOrder) ? 0 : sortOrder,
      is_active: isActive,
    })
    .eq("id", id);

  revalidatePath("/admin/categories");
  revalidatePath("/game/start");
  redirect("/admin/categories");
}

export default async function EditCategoryPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await getSupabaseServerClient();

  const [{ data: category, error: categoryError }, { data: sections, error: sectionsError }] =
    await Promise.all([
      supabase.from("categories").select("*").eq("id", id).single(),
      supabase
        .from("category_sections")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
    ]);

  if (categoryError || !category || sectionsError) {
    return <div className="text-red-300">تعذر تحميل بيانات الفئة.</div>;
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="تعديل الفئة"
        description="قم بتحديث بيانات الفئة."
        action={
          <a
            href="/admin/categories"
            className="rounded-2xl border border-white/10 px-5 py-3 font-semibold text-slate-300"
          >
            الرجوع للفئات
          </a>
        }
      />

      <form
        action={updateCategory}
        className="rounded-[2rem] border border-white/10 bg-white/5 p-6"
      >
        <input type="hidden" name="id" value={category.id} />

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-200">
              اسم الفئة
            </label>
            <input
              name="name"
              defaultValue={category.name}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-200">
              Slug
            </label>
            <input
              name="slug"
              defaultValue={category.slug}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-200">
              القسم الرئيسي
            </label>
            <select
              name="section_id"
              defaultValue={category.section_id ?? ""}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
            >
              <option value="">بدون قسم</option>
              {(sections as Section[]).map((section) => (
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
              defaultValue={category.image_url ?? ""}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-bold text-slate-200">
              الوصف
            </label>
            <textarea
              name="description"
              defaultValue={category.description ?? ""}
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
              defaultValue={category.sort_order}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-8">
            <input
              id="is_active"
              name="is_active"
              type="checkbox"
              defaultChecked={category.is_active}
              className="h-5 w-5"
            />
            <label htmlFor="is_active" className="text-sm font-semibold text-slate-200">
              الفئة مفعّلة
            </label>
          </div>
        </div>

        <div className="mt-8">
          <button
            type="submit"
            className="rounded-2xl bg-cyan-400 px-6 py-3 font-bold text-slate-950"
          >
            حفظ التعديلات
          </button>
        </div>
      </form>
    </div>
  );
}