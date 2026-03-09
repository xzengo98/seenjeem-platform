import AdminEmptyState from "@/components/admin/admin-empty-state";
import AdminPageHeader from "@/components/admin/admin-page-header";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

type SectionRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
};

async function deleteSection(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "");

  const supabase = await getSupabaseServerClient();

  await supabase.from("categories").update({ section_id: null }).eq("section_id", id);
  await supabase.from("category_sections").delete().eq("id", id);

  revalidatePath("/admin/sections");
  revalidatePath("/game/start");
}

export default async function AdminSectionsPage() {
  try {
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
      .from("category_sections")
      .select("id, name, slug, description, sort_order, is_active")
      .order("sort_order", { ascending: true });

    if (error) {
      return (
        <div className="space-y-8">
          <AdminPageHeader
            title="إدارة الأقسام الرئيسية"
            description="حدث خطأ أثناء جلب الأقسام من قاعدة البيانات."
          />

          <div className="rounded-[2rem] border border-red-500/20 bg-red-500/10 p-6 text-red-200">
            فشل تحميل الأقسام: {error.message}
          </div>
        </div>
      );
    }

    const sections = (data ?? []) as SectionRow[];

    return (
      <div className="space-y-8">
        <AdminPageHeader
          title="إدارة الأقسام الرئيسية"
          description="إدارة الأقسام التي تُنظّم الفئات داخل صفحة بدء اللعبة."
          action={
            <a
              href="/admin/sections/new"
              className="rounded-2xl bg-cyan-400 px-5 py-3 font-bold text-slate-950"
            >
              إضافة قسم جديد
            </a>
          }
        />

        {sections.length > 0 ? (
          <div className="grid gap-4">
            {sections.map((section) => (
              <div
                key={section.id}
                className="rounded-[2rem] border border-white/10 bg-white/5 p-6"
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-2xl font-black">{section.name}</h3>
                    <p className="mt-2 text-cyan-300">{section.slug}</p>
                    <p className="mt-4 text-slate-300">
                      {section.description || "بدون وصف"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3 text-sm text-slate-300">
                    <span className="rounded-full bg-slate-900/70 px-3 py-1">
                      ترتيب: {section.sort_order}
                    </span>
                    <span className="rounded-full bg-slate-900/70 px-3 py-1">
                      {section.is_active ? "مفعّل" : "غير مفعّل"}
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href={`/admin/sections/edit/${section.id}`}
                    className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 font-semibold text-cyan-300"
                  >
                    تعديل
                  </a>

                  <form action={deleteSection}>
                    <input type="hidden" name="id" value={section.id} />
                    <button
                      type="submit"
                      className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-3 font-semibold text-red-300"
                    >
                      حذف
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <AdminEmptyState
            title="لا توجد أقسام رئيسية بعد"
            description="أضف أول قسم رئيسي مثل عام أو إسلامي أو فن وترفيه."
            buttonText="إضافة أول قسم"
          />
        )}
      </div>
    );
  } catch (error) {
    return (
      <div className="space-y-8">
        <AdminPageHeader
          title="إدارة الأقسام الرئيسية"
          description="حدث خطأ أثناء جلب البيانات من قاعدة البيانات."
        />

        <div className="rounded-[2rem] border border-red-500/20 bg-red-500/10 p-6 text-red-200">
          فشل تحميل الأقسام:{" "}
          {error instanceof Error ? error.message : "Unknown error"}
        </div>
      </div>
    );
  }
}