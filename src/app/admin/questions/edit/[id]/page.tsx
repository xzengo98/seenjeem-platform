import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import HtmlSnippetEditor from "@/components/admin/html-snippet-editor";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function EditQuestionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string; returnTo?: string }>;
}) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const errorMessage = resolvedSearchParams?.error ?? "";
  const returnTo =
    resolvedSearchParams?.returnTo?.trim() || "/admin/questions";

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
    const year_tolerance_before = Number(formData.get("year_tolerance_before") || 0);
    const year_tolerance_after = Number(formData.get("year_tolerance_after") || 0);
    const returnToValue =
      formData.get("returnTo")?.toString().trim() || "/admin/questions";

    if (!question_text || !answer_text || !category_id) {
      redirect(
        `/admin/questions/edit/${id}?error=${encodeURIComponent("نص السؤال والإجابة والفئة مطلوبة")}&returnTo=${encodeURIComponent(returnToValue)}`,
      );
    }

    const { error } = await supabase
      .from("questions")
      .update({
        question_text,
        answer_text,
        category_id,
        points,
        is_active,
        year_tolerance_before,
        year_tolerance_after,
      })
      .eq("id", id);

    if (error) {
      redirect(
        `/admin/questions/edit/${id}?error=${encodeURIComponent(error.message)}&returnTo=${encodeURIComponent(returnToValue)}`,
      );
    }

    redirect(returnToValue);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="rounded-[2rem] border border-white/10 bg-[#071126] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-cyan-300">إدارة المحتوى</div>
            <h1 className="mt-2 text-4xl font-black text-white">تعديل السؤال</h1>
            <p className="mt-3 text-lg leading-8 text-white/75">
              عدّل السؤال والإجابة ويمكنك إدراج صورة أو فيديو داخل المحتوى مباشرة.
            </p>
          </div>

          <Link
            href={returnTo}
            className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
          >
            الرجوع للأسئلة
          </Link>
        </div>

        {errorMessage ? (
          <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-red-100">
            {errorMessage}
          </div>
        ) : null}

        <form action={updateQuestion} className="space-y-6">
          <input type="hidden" name="returnTo" value={returnTo} />

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold text-white">
                سماحية سنة قبل
              </label>
              <select
                name="year_tolerance_before"
                defaultValue={String(question.year_tolerance_before ?? 0)}
                className="h-14 w-full rounded-2xl border border-white/10 bg-[#030b22] px-4 text-white outline-none"
              >
                <option value="0">بدون سماحية سنة قبل</option>
                <option value="1">سنة واحدة قبل</option>
                <option value="2">سنتان قبل</option>
                <option value="5">5 سنوات قبل</option>
                <option value="10">10 سنوات قبل</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-white">
                سماحية سنة بعد
              </label>
              <select
                name="year_tolerance_after"
                defaultValue={String(question.year_tolerance_after ?? 0)}
                className="h-14 w-full rounded-2xl border border-white/10 bg-[#030b22] px-4 text-white outline-none"
              >
                <option value="0">بدون سماحية سنة بعد</option>
                <option value="1">سنة واحدة بعد</option>
                <option value="2">سنتان بعد</option>
                <option value="5">5 سنوات بعد</option>
                <option value="10">10 سنوات بعد</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold text-white">
                الفئة
              </label>
              <select
                name="category_id"
                defaultValue={question.category_id ?? ""}
                className="h-14 w-full rounded-2xl border border-white/10 bg-[#030b22] px-4 text-white outline-none"
              >
                {categories?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-white">
                النقاط
              </label>
              <select
                name="points"
                defaultValue={String(question.points ?? 200)}
                className="h-14 w-full rounded-2xl border border-white/10 bg-[#030b22] px-4 text-white outline-none"
              >
                <option value="200">200</option>
                <option value="400">400</option>
                <option value="600">600</option>
              </select>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
  <HtmlSnippetEditor
    label="نص السؤال"
    name="question_text"
    defaultValue={question.question_text ?? ""}
  />
</div>

<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
  <HtmlSnippetEditor
    label="نص الإجابة"
    name="answer_text"
    defaultValue={question.answer_text ?? ""}
  />
</div>

          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-white">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={Boolean(question.is_active)}
              className="h-5 w-5 rounded border-white/20 bg-[#030b22]"
            />
            السؤال مفعّل
          </label>

          <div className="flex flex-wrap gap-3">
            <Link
              href={returnTo}
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              إلغاء
            </Link>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-2xl bg-cyan-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-400"
            >
              حفظ التعديلات
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}