import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import AdminEmptyState from "@/components/admin/admin-empty-state";
import AdminPageHeader from "@/components/admin/admin-page-header";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SectionRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number | null;
  is_active: boolean | null;
};

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

async function deleteSectionAction(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    redirect(
      "/admin/sections?error=" + encodeURIComponent("معرّف القسم مفقود.")
    );
  }

  const supabase = await requireAdmin();

  const { error: unlinkError } = await supabase
    .from("categories")
    .update({ section_id: null })
    .eq("section_id", id);

  if (unlinkError) {
    redirect(
      "/admin/sections?error=" +
        encodeURIComponent(`فشل فك ربط الفئات من القسم: ${unlinkError.message}`)
    );
  }

  const { error: deleteError } = await supabase
    .from("category_sections")
    .delete()
    .eq("id", id);

  if (deleteError) {
    redirect(
      "/admin/sections?error=" +
        encodeURIComponent(`فشل حذف القسم: ${deleteError.message}`)
    );
  }

  revalidatePath("/admin/sections");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/questions");
  revalidatePath("/admin/games");
  revalidatePath("/game/start");

  redirect(
    "/admin/sections?success=" + encodeURIComponent("تم حذف القسم بنجاح.")
  );
}

export default async function AdminSectionsPage({
  searchParams,
}: {
  searchParams?: Promise<{ success?: string; error?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const supabase = await requireAdmin();

  const { data, error } = await supabase
    .from("category_sections")
    .select("id, name, slug, description, sort_order, is_active")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    return (
      <main dir="rtl" className="min-h-screen bg-slate-950 p-6 text-white">
        <div className="mx-auto max-w-6xl rounded-3xl border border-red-500/20 bg-red-500/10 p-6">
          فشل تحميل الأقسام: {error.message}
        </div>
      </main>
    );
  }

  const sections = (data ?? []) as SectionRow[];

  return (
    <main dir="rtl" className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <AdminPageHeader
          title="إدارة الأقسام"
          description="إضافة وتعديل وحذف أقسام الفئات الرئيسية."
          action={
            <Link
              href="/admin/sections/new"
              className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-bold text-slate-950"
            >
              إضافة قسم جديد
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

        {sections.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sections.map((section) => (
              <div
                key={section.id}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
              >
                <div className="space-y-3">
                  <div>
                    <h3 className="text-xl font-black text-white">
                      {section.name}
                    </h3>
                    <p className="mt-1 text-sm text-slate-400">
                      {section.slug}
                    </p>
                  </div>

                  <p className="min-h-12 text-sm leading-7 text-slate-300">
                    {section.description || "بدون وصف"}
                  </p>

                  <div className="space-y-1 text-sm text-slate-400">
                    <p>الترتيب: {section.sort_order ?? 0}</p>
                    <p>{section.is_active ? "مفعّل" : "غير مفعّل"}</p>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <Link
                      href={`/admin/sections/edit/${section.id}`}
                      className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-bold text-cyan-200"
                    >
                      تعديل
                    </Link>

                    <form action={deleteSectionAction}>
                      <input type="hidden" name="id" value={section.id} />
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
          <>
            <AdminEmptyState
              title="لا توجد أقسام بعد"
              description="ابدأ بإضافة أول قسم لعرضه هنا."
              buttonText="إضافة قسم جديد"
            />
            <div className="text-center">
              <Link
                href="/admin/sections/new"
                className="inline-flex rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950"
              >
                إضافة قسم جديد
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}