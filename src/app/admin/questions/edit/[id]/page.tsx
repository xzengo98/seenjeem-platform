import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function EditQuestionPage({
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

  const { data: question } = await supabase
    .from("questions")
    .select("*")
    .eq("id", id)
    .single();

  if (!question) notFound();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  async function updateQuestion(formData: FormData) {
    "use server";

    const supabase = await getSupabaseServerClient();

    const question_text = formData.get("question_text")?.toString().trim() || "";
    const answer_text = formData.get("answer_text")?.toString().trim() || "";
    const category_id = formData.get("category_id")?.toString().trim() || "";
    const points = Number(formData.get("points") || 200);
    const is_active = formData.get("is_active") === "on";

    const media_type =
      (formData.get("media_type")?.toString() as "none" | "image" | "video") ||
      "none";
    const media_url = formData.get("media_url")?.toString().trim() || null;
    const year_tolerance_before = Number(formData.get("year_tolerance_before") || 0);
    const year_tolerance_after = Number(formData.get("year_tolerance_after") || 0);

    if (!question_text || !answer_text || !category_id) {
      redirect(`/admin/questions/edit/${id}?error=نص السؤال والإجابة والفئة مطلوبة`);
    }

    const { error } = await supabase
      .from("questions")
      .update({
        question_text,
        answer_text,
        category_id,
        points,
        is_active,
        media_type,
        media_url,
        year_tolerance_before,
        year_tolerance_after,
      })
      .eq("id", id);

    if (error) {
      redirect(`/admin/questions/edit/${id}?error=${encodeURIComponent(error.message)}`);
    }

    redirect("/admin/questions");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black">تعديل السؤال</h1>
              <p className="mt-2 text-slate-300">
                عدّل نص السؤال والإجابة والوسائط وسماحية السنوات.
              </p>
            </div>

            <Link
              href="/admin/questions"
              className="rounded-2xl border border-white/10 px-5 py-3 font-semibold text-slate-300"
            >
              الرجوع للأسئلة
            </Link>
          </div>
        </div>

        <form
          action={updateQuestion}
          className="rounded-[2rem] border border-white/10 bg-white/5 p-6"
        >
          <div>
            <label className="mb-2 block text-sm font-bold">نص السؤال</label>
            <textarea
              name="question_text"
              rows={5}
              defaultValue={question.question_text}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
            />
          </div>

          <div className="mt-6">
            <label className="mb-2 block text-sm font-bold">الإجابة</label>
            <textarea
              name="answer_text"
              rows={4}
              defaultValue={question.answer_text}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
            />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold">نوع الوسائط</label>
              <select
                name="media_type"
                defaultValue={question.media_type ?? "none"}
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
              >
                <option value="none">بدون وسائط</option>
                <option value="image">صورة</option>
                <option value="video">فيديو</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">رابط الصورة أو الفيديو</label>
              <input
                name="media_url"
                type="url"
                defaultValue={question.media_url ?? ""}
                placeholder="https://example.com/file.jpg أو https://youtube.com/watch?v=..."
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
              />
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold">سماحية سنة قبل</label>
              <select
                name="year_tolerance_before"
                defaultValue={String(question.year_tolerance_before ?? 0)}
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
              >
                <option value="0">بدون سماحية</option>
                <option value="1">سنة واحدة قبل</option>
                <option value="2">سنتان قبل</option>
                <option value="5">5 سنوات قبل</option>
                <option value="10">10 سنوات قبل</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">سماحية سنة بعد</label>
              <select
                name="year_tolerance_after"
                defaultValue={String(question.year_tolerance_after ?? 0)}
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
              >
                <option value="0">بدون سماحية</option>
                <option value="1">سنة واحدة بعد</option>
                <option value="2">سنتان بعد</option>
                <option value="5">5 سنوات بعد</option>
                <option value="10">10 سنوات بعد</option>
              </select>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold">الفئة</label>
              <select
                name="category_id"
                defaultValue={question.category_id}
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
              >
                {categories?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">النقاط</label>
              <select
                name="points"
                defaultValue={String(question.points)}
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
              >
                <option value="200">200</option>
                <option value="400">400</option>
                <option value="600">600</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <input
              id="is_active"
              name="is_active"
              type="checkbox"
              defaultChecked={question.is_active}
              className="h-5 w-5"
            />
            <label htmlFor="is_active" className="font-bold">
              السؤال مفعّل
            </label>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <Link
              href="/admin/questions"
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