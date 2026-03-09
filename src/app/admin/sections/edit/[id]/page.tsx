import AdminPageHeader from "@/components/admin/admin-page-header";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

async function updateSection(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const sortOrder = Number(formData.get("sort_order") ?? 0);
  const isActive = formData.get("is_active") === "on";

  const supabase = getSupabaseServerClient();

  await supabase
    .from("category_sections")
    .update({
      name,
      slug,
      description: description || null,
      sort_order: Number.isNaN(sortOrder) ? 0 : sortOrder,
      is_active: isActive,
    })
    .eq("id", id);

  revalidatePath("/admin/sections");
  revalidatePath("/game/start");
  redirect("/admin/sections");
}

export default async function EditSectionPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("category_sections")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return <div className="text-red-300">تعذر تحميل القسم.</div>;
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="تعديل القسم الرئيسي"
        description="قم بتحديث بيانات القسم الرئيسي."
        action={
          <a
            href="/admin/sections"
            className="rounded-2xl border border-white/10 px-5 py-3 font-semibold text-slate-300"
          >
            الرجوع للأقسام
          </a>
        }
      />

      <form
        action={updateSection}
        className="rounded-[2rem] border border-white/10 bg-white/5 p-6"
      >
        <input type="hidden" name="id" value={data.id} />

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-200">
              اسم القسم
            </label>
            <input
              name="name"
              defaultValue={data.name}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-200">
              Slug
            </label>
            <input
              name="slug"
              defaultValue={data.slug}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-bold text-slate-200">
              الوصف
            </label>
            <textarea
              name="description"
              defaultValue={data.description ?? ""}
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
              defaultValue={data.sort_order}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-8">
            <input
              id="is_active"
              name="is_active"
              type="checkbox"
              defaultChecked={data.is_active}
              className="h-5 w-5"
            />
            <label htmlFor="is_active" className="text-sm font-semibold text-slate-200">
              القسم مفعّل
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