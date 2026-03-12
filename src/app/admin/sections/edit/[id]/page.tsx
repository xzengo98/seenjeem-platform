import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import AdminPageHeader from "@/components/admin/admin-page-header";
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

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string }>;
};

export default async function EditSectionPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const qs = (await searchParams) ?? {};
  const supabase = await requireAdmin();

  const { data, error } = await supabase
    .from("category_sections")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  async function updateSection(formData: FormData) {
    "use server";

    const supabase = await requireAdmin();

    const name = String(formData.get("name") ?? "").trim();
    const slugInput = String(formData.get("slug") ?? "").trim();
    const slug = toSlug(slugInput || name);
    const description = String(formData.get("description") ?? "").trim() || null;
    const sort_order = Number(formData.get("sort_order") ?? 0) || 0;
    const is_active = formData.get("is_active") === "on";

    if (!name) {
      redirect(
        `/admin/sections/edit/${id}?error=` +
          encodeURIComponent("اسم القسم مطلوب.")
      );
    }

    if (!slug) {
      redirect(
        `/admin/sections/edit/${id}?error=` +
          encodeURIComponent("تعذر إنشاء slug صالح.")
      );
    }

    const { data: existingSlug, error: slugError } = await supabase
      .from("category_sections")
      .select("id")
      .eq("slug", slug)
      .neq("id", id)
      .maybeSingle();

    if (slugError) {
      redirect(
        `/admin/sections/edit/${id}?error=` +
          encodeURIComponent(slugError.message)
      );
    }

    if (existingSlug) {
      redirect(
        `/admin/sections/edit/${id}?error=` +
          encodeURIComponent("هذا الـ slug مستخدم مسبقًا لقسم آخر.")
      );
    }

    const { error } = await supabase
      .from("category_sections")
      .update({
        name,
        slug,
        description,
        sort_order,
        is_active,
      })
      .eq("id", id);

    if (error) {
      redirect(
        `/admin/sections/edit/${id}?error=` +
          encodeURIComponent(error.message)
      );
    }

    revalidatePath("/admin/sections");
    revalidatePath("/admin/categories");
    revalidatePath("/admin/questions");
    revalidatePath("/admin/games");
    revalidatePath("/game/start");

    redirect(
      "/admin/sections?success=" +
        encodeURIComponent("تم تحديث القسم بنجاح.")
    );
  }

  return (
    <main dir="rtl" className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-3xl space-y-6">
        <AdminPageHeader
          title="تعديل القسم"
          description="حدّث بيانات القسم ثم احفظ التعديلات."
          action={
            <Link
              href="/admin/sections"
              className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-300"
            >
              الرجوع للأقسام
            </Link>
          }
        />

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          {qs.error ? (
            <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-red-100">
              {qs.error}
            </div>
          ) : null}

          <form action={updateSection} className="space-y-6">
            <input type="hidden" name="id" value={id} />

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-200">
                اسم القسم
              </label>
              <input
                name="name"
                required
                defaultValue={data.name ?? ""}
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-200">
                Slug
              </label>
              <input
                name="slug"
                defaultValue={data.slug ?? ""}
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-200">
                الوصف
              </label>
              <textarea
                name="description"
                rows={4}
                defaultValue={data.description ?? ""}
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-200">
                  الترتيب
                </label>
                <input
                  name="sort_order"
                  type="number"
                  defaultValue={data.sort_order ?? 0}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-8">
                <input
                  id="is_active"
                  name="is_active"
                  type="checkbox"
                  defaultChecked={Boolean(data.is_active)}
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

            <div className="flex flex-wrap gap-4">
              <button
                type="submit"
                className="rounded-2xl bg-cyan-400 px-6 py-3 font-bold text-slate-950"
              >
                حفظ التعديلات
              </button>

              <Link
                href="/admin/sections"
                className="rounded-2xl border border-white/10 px-6 py-3 font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white"
              >
                إلغاء
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}