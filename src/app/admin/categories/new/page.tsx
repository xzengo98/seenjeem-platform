import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function createCategory(formData: FormData) {
  "use server";

  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const description = String(formData.get("description") ?? "").trim();
  const sortOrder = Number(formData.get("sort_order") ?? 0);
  const isActive = formData.get("is_active") === "on";

  if (!name || !slug) {
    throw new Error("اسم الفئة و slug مطلوبين.");
  }

  const supabase = getSupabaseServerClient();

  const { error } = await supabase.from("categories").insert({
    name,
    slug,
    description: description || null,
    sort_order: Number.isNaN(sortOrder) ? 0 : sortOrder,
    is_active: isActive,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export default function NewCategoryPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black">إضافة فئة جديدة</h2>
          <p className="mt-2 text-slate-300">
            أضف فئة جديدة لتظهر في لوحة التحكم وفي نظام اللعبة لاحقًا.
          </p>
        </div>

        <a
          href="/admin/categories"
          className="rounded-2xl border border-white/10 px-5 py-3 font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white"
        >
          الرجوع للفئات
        </a>
      </div>

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
              type="text"
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
              type="text"
              placeholder="example: history"
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-bold text-slate-200">
              الوصف
            </label>
            <textarea
              name="description"
              placeholder="وصف مختصر للفئة"
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
              الفئة مفعلة
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