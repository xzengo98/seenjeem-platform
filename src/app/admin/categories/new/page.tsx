import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function requireAdmin() {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || !profile || profile.role !== "admin") {
    redirect("/");
  }

  return supabase;
}

export default async function NewCategoryPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const supabase = await requireAdmin();

  const { data: sections, error: sectionsError } = await supabase
    .from("category_sections")
    .select("id, name")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (sectionsError) {
    return (
      <main dir="rtl" className="min-h-screen bg-slate-950 p-6 text-white">
        <div className="mx-auto max-w-3xl rounded-3xl border border-red-500/20 bg-red-500/10 p-6">
          فشل تحميل الأقسام: {sectionsError.message}
        </div>
      </main>
    );
  }

  async function createCategory(formData: FormData) {
    "use server";

    const supabase = await requireAdmin();

    const name = String(formData.get("name") ?? "").trim();
    const slugInput = String(formData.get("slug") ?? "").trim();
    const slug = toSlug(slugInput || name);
    const description = String(formData.get("description") ?? "").trim() || null;
    const image_url = String(formData.get("image_url") ?? "").trim() || null;
    const section_id = String(formData.get("section_id") ?? "").trim() || null;
    const sort_order = Number(formData.get("sort_order") ?? 0) || 0;
    const is_active = formData.get("is_active") === "on";

    if (!name) {
      redirect(
        "/admin/categories/new?error=" +
          encodeURIComponent("اسم الفئة مطلوب.")
      );
    }

    if (!slug) {
      redirect(
        "/admin/categories/new?error=" +
          encodeURIComponent("تعذر إنشاء slug صالح.")
      );
    }

    const { data: existingSlug } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existingSlug) {
      redirect(
        "/admin/categories/new?error=" +
          encodeURIComponent("هذا الـ slug مستخدم مسبقًا.")
      );
    }

    const { error } = await supabase.from("categories").insert({
      name,
      slug,
      description,
      image_url,
      section_id,
      sort_order,
      is_active,
    });

    if (error) {
      redirect(
        "/admin/categories/new?error=" + encodeURIComponent(error.message)
      );
    }

    revalidatePath("/admin/categories");
    revalidatePath("/admin/questions");
    revalidatePath("/admin/games");
    revalidatePath("/game/start");

    redirect("/admin/categories");
  }

  return (
    <main dir="rtl" className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black">إضافة فئة جديدة</h1>
            <p className="mt-2 text-slate-300">
              أضف فئة جديدة وحدد القسم والوصف والصورة والترتيب.
            </p>
          </div>

          <Link
            href="/admin/categories"
            className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-300"
          >
            الرجوع للفئات
          </Link>
        </div>

        {params.error ? (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-red-100">
            {params.error}
          </div>
        ) : null}

        <form action={createCategory} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-bold">اسم الفئة</label>
            <input
              name="name"
              required
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold">Slug</label>
            <input
              name="slug"
              placeholder="اتركه فارغًا ليتم توليده من الاسم"
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold">رابط الصورة</label>
            <input
              name="image_url"
              type="url"
              placeholder="https://example.com/image.jpg"
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold">القسم الرئيسي</label>
            <select
              name="section_id"
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
              defaultValue=""
            >
              <option value="">بدون قسم</option>
              {sections?.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold">الوصف</label>
            <textarea
              name="description"
              rows={4}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold">الترتيب</label>
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
              <label htmlFor="is_active" className="font-bold">
                الفئة مفعلة
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3">
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
              حفظ الفئة
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}