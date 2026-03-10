import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/");
  }

  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .single();

  if (!category) notFound();

  const { data: sections } = await supabase
    .from("category_sections")
    .select("id, name")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  async function updateCategory(formData: FormData) {
    "use server";

    const supabase = await getSupabaseServerClient();

    const name = formData.get("name")?.toString().trim() || "";
    const slug = formData.get("slug")?.toString().trim() || "";
    const description = formData.get("description")?.toString().trim() || null;
    const image_url = formData.get("image_url")?.toString().trim() || null;
    const section_id = formData.get("section_id")?.toString().trim() || null;
    const sort_order = Number(formData.get("sort_order") || 0);
    const is_active = formData.get("is_active") === "on";

    if (!name || !slug) {
      redirect(`/admin/categories/edit/${id}?error=الاسم والـ slug مطلوبان`);
    }

    const { error } = await supabase
      .from("categories")
      .update({
        name,
        slug,
        description,
        image_url,
        section_id: section_id || null,
        sort_order,
        is_active,
      })
      .eq("id", id);

    if (error) {
      redirect(`/admin/categories/edit/${id}?error=${encodeURIComponent(error.message)}`);
    }

    redirect("/admin/categories");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black">تعديل الفئة</h1>
              <p className="mt-2 text-slate-300">
                عدّل بيانات الفئة والقسم والصورة والوصف والترتيب.
              </p>
            </div>

            <Link
              href="/admin/categories"
              className="rounded-2xl border border-white/10 px-5 py-3 font-semibold text-slate-300"
            >
              الرجوع للفئات
            </Link>
          </div>
        </div>

        <form
          action={updateCategory}
          className="rounded-[2rem] border border-white/10 bg-white/5 p-6"
        >
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold">اسم الفئة</label>
              <input
                name="name"
                defaultValue={category.name}
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">Slug</label>
              <input
                name="slug"
                defaultValue={category.slug}
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">رابط الصورة</label>
              <input
                name="image_url"
                type="url"
                defaultValue={category.image_url ?? ""}
                placeholder="https://example.com/category-image.jpg"
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
              />
              <p className="mt-2 text-xs text-slate-400">
                ضع رابط صورة مباشر، وسيتم عرضها داخل الفئة تلقائيًا.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">القسم الرئيسي</label>
              <select
                name="section_id"
                defaultValue={category.section_id ?? ""}
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
              >
                <option value="">بدون قسم</option>
                {sections?.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6">
            <label className="mb-2 block text-sm font-bold">الوصف</label>
            <textarea
              name="description"
              rows={4}
              defaultValue={category.description ?? ""}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
            />
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold">الترتيب</label>
              <input
                name="sort_order"
                type="number"
                defaultValue={category.sort_order ?? 0}
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
              <label htmlFor="is_active" className="font-bold">
                الفئة مفعلة
              </label>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <Link
              href="/admin/categories"
              className="rounded-2xl border border-white/10 px-5 py-3 font-semibold text-slate-300"
            >
              إلغاء
            </Link>
            <button
              type="submit"
              className="rounded-2xl bg-cyan-400 px-6 py-3 font-black text-slate-950"
            >
              حفظ التعديلات
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}