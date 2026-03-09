import AdminPageHeader from "@/components/admin/admin-page-header";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function createSection(formData: FormData) {
  "use server";

  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const sortOrder = Number(formData.get("sort_order") ?? 0);
  const isActive = formData.get("is_active") === "on";

  if (!name || !slug) {
    throw new Error("اسم القسم و slug مطلوبان.");
  }

  const supabase = getSupabaseServerClient();

  const { error } = await supabase.from("category_sections").insert({
    name,
    slug,
    description: description || null,
    sort_order: Number.isNaN(sortOrder) ? 0 : sortOrder,
    is_active: isActive,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/sections");
  revalidatePath("/game/start");
  redirect("/admin/sections");
}

export default function NewSectionPage() {
  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="إضافة قسم رئيسي جديد"
        description="أضف قسمًا رئيسيًا جديدًا لتجميع الفئات تحته داخل صفحة بدء اللعبة."
        action={
          <a
            href="/admin/sections"
            className="rounded-2xl border border-white/10 px-5 py-3 font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white"
          >
            الرجوع للأقسام
          </a>
        }
      />

      <form
        action={createSection}
        className="rounded-[2rem] border border-white/10 bg-white/5 p-6"
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-200">
              اسم القسم
            </label>
            <input
              name="name"
              placeholder="مثال: عام"
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-200">
              Slug
            </label>
            <input
              name="slug"
              placeholder="مثال: general"
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-bold text-slate-200">
              الوصف
            </label>
            <textarea
              name="description"
              placeholder="وصف مختصر عن هذا القسم"
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
              القسم مفعّل
            </label>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          <button
            type="submit"
            className="rounded-2xl bg-cyan-400 px-6 py-3 font-bold text-slate-950"
          >
            حفظ القسم
          </button>

          <a
            href="/admin/sections"
            className="rounded-2xl border border-white/10 px-6 py-3 font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white"
          >
            إلغاء
          </a>
        </div>
      </form>
    </div>
  );
}