import AdminEmptyState from "@/components/admin/admin-empty-state";
import AdminPageHeader from "@/components/admin/admin-page-header";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import Image from "next/image";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  category_sections:
    | { name: string; slug: string }
    | { name: string; slug: string }[]
    | null;
};

function getSectionName(
  section:
    | { name: string; slug: string }
    | { name: string; slug: string }[]
    | null
) {
  if (!section) return "بدون قسم";
  if (Array.isArray(section)) return section[0]?.name ?? "بدون قسم";
  return section.name;
}

async function deleteCategory(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "");
  const supabase = getSupabaseServerClient();

  await supabase.from("questions").delete().eq("category_id", id);
  await supabase.from("categories").delete().eq("id", id);

  revalidatePath("/admin/categories");
  revalidatePath("/game/start");
}

export default async function AdminCategoriesPage() {
  try {
    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from("categories")
      .select(`
        id,
        name,
        slug,
        description,
        image_url,
        sort_order,
        is_active,
        category_sections (
          name,
          slug
        )
      `)
      .order("sort_order", { ascending: true });

    if (error) {
      return (
        <div className="space-y-8">
          <AdminPageHeader
            title="إدارة الفئات"
            description="حدث خطأ أثناء جلب الفئات من قاعدة البيانات."
          />

          <div className="rounded-[2rem] border border-red-500/20 bg-red-500/10 p-6 text-red-200">
            فشل تحميل الفئات: {error.message}
          </div>
        </div>
      );
    }

    const categories = (data ?? []) as unknown as CategoryRow[];

    return (
      <div className="space-y-8">
        <AdminPageHeader
          title="إدارة الفئات"
          description="إدارة الفئات وربطها بالأقسام والصور."
          action={
            <a
              href="/admin/categories/new"
              className="rounded-2xl bg-cyan-400 px-5 py-3 font-bold text-slate-950"
            >
              إضافة فئة جديدة
            </a>
          }
        />

        {categories.length > 0 ? (
          <div className="grid gap-4">
            {categories.map((category) => (
              <div
                key={category.id}
                className="rounded-[2rem] border border-white/10 bg-white/5 p-6"
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div className="flex gap-4">
                    <div className="relative h-24 w-24 overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
                      {category.image_url ? (
                        <Image
                          src={category.image_url}
                          alt={category.name}
                          fill
                          className="object-contain p-2"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-3xl">
                          ✨
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-2xl font-black">{category.name}</h3>
                      <p className="mt-2 text-cyan-300">{category.slug}</p>
                      <p className="mt-3 text-slate-300">
                        {category.description || "بدون وصف"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 text-sm text-slate-300">
                    <span className="rounded-full bg-slate-900/70 px-3 py-1">
                      القسم: {getSectionName(category.category_sections)}
                    </span>
                    <span className="rounded-full bg-slate-900/70 px-3 py-1">
                      ترتيب: {category.sort_order}
                    </span>
                    <span className="rounded-full bg-slate-900/70 px-3 py-1">
                      {category.is_active ? "مفعّلة" : "غير مفعّلة"}
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href={`/admin/categories/edit/${category.id}`}
                    className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 font-semibold text-cyan-300"
                  >
                    تعديل
                  </a>

                  <form action={deleteCategory}>
                    <input type="hidden" name="id" value={category.id} />
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
            title="لا توجد فئات بعد"
            description="ابدأ بإضافة أول فئة مع القسم الرئيسي والصورة."
            buttonText="إضافة أول فئة"
          />
        )}
      </div>
    );
  } catch (error) {
    return (
      <div className="space-y-8">
        <AdminPageHeader
          title="إدارة الفئات"
          description="حدث خطأ أثناء جلب البيانات من قاعدة البيانات."
        />

        <div className="rounded-[2rem] border border-red-500/20 bg-red-500/10 p-6 text-red-200">
          فشل تحميل الفئات:{" "}
          {error instanceof Error ? error.message : "Unknown error"}
        </div>
      </div>
    );
  }
}