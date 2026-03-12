import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import AdminEmptyState from "@/components/admin/admin-empty-state";
import AdminPageHeader from "@/components/admin/admin-page-header";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number | null;
  is_active: boolean | null;
  section_id: string | null;
  category_sections:
    | { name: string; slug: string | null }
    | { name: string; slug: string | null }[]
    | null;
};

function getSectionName(
  section:
    | { name: string; slug: string | null }
    | { name: string; slug: string | null }[]
    | null
) {
  if (!section) return "بدون قسم";
  if (Array.isArray(section)) return section[0]?.name ?? "بدون قسم";
  return section.name;
}

async function requireAdmin() {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

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

async function deleteCategoryAction(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    redirect("/admin/categories?error=" + encodeURIComponent("معرّف الفئة مفقود."));
  }

  const supabase = await requireAdmin();

  const { error: questionsError } = await supabase
    .from("questions")
    .delete()
    .eq("category_id", id);

  if (questionsError) {
    redirect(
      "/admin/categories?error=" +
        encodeURIComponent(`فشل حذف الأسئلة المرتبطة: ${questionsError.message}`)
    );
  }

  const { error: categoryError } = await supabase
    .from("categories")
    .delete()
    .eq("id", id);

  if (categoryError) {
    redirect(
      "/admin/categories?error=" +
        encodeURIComponent(`فشل حذف الفئة: ${categoryError.message}`)
    );
  }

  revalidatePath("/admin/categories");
  revalidatePath("/admin/questions");
  revalidatePath("/admin/games");
  revalidatePath("/game/start");

  redirect(
    "/admin/categories?success=" +
      encodeURIComponent("تم حذف الفئة بنجاح.")
  );
}

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams?: Promise<{ success?: string; error?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const supabase = await requireAdmin();

  const { data, error } = await supabase
    .from("categories")
    .select(
      `
        id,
        name,
        slug,
        description,
        image_url,
        sort_order,
        is_active,
        section_id,
        category_sections (
          name,
          slug
        )
      `
    )
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    return (
      <main dir="rtl" className="min-h-screen bg-slate-950 p-6 text-white">
        <div className="mx-auto max-w-6xl rounded-3xl border border-red-500/20 bg-red-500/10 p-6">
          فشل تحميل الفئات: {error.message}
        </div>
      </main>
    );
  }

  const categories = (data ?? []) as unknown as CategoryRow[];

  return (
    <main dir="rtl" className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <AdminPageHeader
  title="إدارة الفئات"
  description="إضافة وتعديل وحذف فئات الأسئلة."
  action={
    <Link
      href="/admin/categories/new"
      className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-bold text-slate-950"
    >
      إضافة فئة جديدة
    </Link>
  }
/>

        {params.success ? (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-emerald-100">
            {params.success}
          </div>
        ) : null}

        {params.error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-red-100">
            {params.error}
          </div>
        ) : null}

        {categories.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {categories.map((category) => (
              <div
                key={category.id}
                className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]"
              >
                <div className="relative h-48 w-full bg-slate-900">
                  {category.image_url ? (
                    <Image
                      src={category.image_url}
                      alt={category.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-5xl">
                      ✨
                    </div>
                  )}
                </div>

                <div className="space-y-3 p-5">
                  <div>
                    <h3 className="text-xl font-black">{category.name}</h3>
                    <p className="mt-1 text-sm text-slate-400">{category.slug}</p>
                  </div>

                  <p className="min-h-12 text-sm leading-7 text-slate-300">
                    {category.description || "بدون وصف"}
                  </p>

                  <div className="space-y-1 text-sm text-slate-400">
                    <p>القسم: {getSectionName(category.category_sections)}</p>
                    <p>الترتيب: {category.sort_order ?? 0}</p>
                    <p>{category.is_active ? "مفعّلة" : "غير مفعّلة"}</p>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <Link
                      href={`/admin/categories/edit/${category.id}`}
                      className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-bold text-cyan-200"
                    >
                      تعديل
                    </Link>

                    <form action={deleteCategoryAction}>
                      <input type="hidden" name="id" value={category.id} />
                      <button
                        type="submit"
                        className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-200"
                      >
                        حذف
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <AdminEmptyState
  title="لا توجد فئات بعد"
  description="ابدأ بإضافة أول فئة لعرضها هنا."
  buttonText="إضافة فئة جديدة"
/>
        )}
      </div>
    </main>
  );
}