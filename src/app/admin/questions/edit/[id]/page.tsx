import AdminPageHeader from "@/components/admin/admin-page-header";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Category = {
  id: string;
  name: string;
  slug: string;
};

type PageProps = {
  params: Promise<{ id: string }>;
};

async function updateQuestion(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "");
  const categoryId = String(formData.get("category_id") ?? "").trim();
  const questionText = String(formData.get("question_text") ?? "").trim();
  const answerText = String(formData.get("answer_text") ?? "").trim();
  const points = Number(formData.get("points") ?? 200);
  const isActive = formData.get("is_active") === "on";

  const supabase = getSupabaseServerClient();

  await supabase
    .from("questions")
    .update({
      category_id: categoryId,
      question_text: questionText,
      answer_text: answerText,
      points: Number.isNaN(points) ? 200 : points,
      is_active: isActive,
    })
    .eq("id", id);

  revalidatePath("/admin/questions");
  revalidatePath("/game/board");
  redirect("/admin/questions");
}

export default async function EditQuestionPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = getSupabaseServerClient();

  const [{ data: question, error: questionError }, { data: categories, error: categoriesError }] =
    await Promise.all([
      supabase.from("questions").select("*").eq("id", id).single(),
      supabase
        .from("categories")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
    ]);

  if (questionError || !question || categoriesError) {
    return <div className="text-red-300">تعذر تحميل بيانات السؤال.</div>;
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="تعديل السؤال"
        description="قم بتحديث نص السؤال والإجابة والنقاط والفئة."
        action={
          <a
            href="/admin/questions"
            className="rounded-2xl border border-white/10 px-5 py-3 font-semibold text-slate-300"
          >
            الرجوع للأسئلة
          </a>
        }
      />

      <form
        action={updateQuestion}
        className="rounded-[2rem] border border-white/10 bg-white/5 p-6"
      >
        <input type="hidden" name="id" value={question.id} />

        <div className="grid gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-bold text-slate-200">
              نص السؤال
            </label>
            <textarea
              name="question_text"
              defaultValue={question.question_text}
              rows={4}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-bold text-slate-200">
              الإجابة
            </label>
            <textarea
              name="answer_text"
              defaultValue={question.answer_text ?? ""}
              rows={3}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-200">
              الفئة
            </label>
            <select
              name="category_id"
              defaultValue={question.category_id}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
            >
              {(categories as Category[]).map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category.slug})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-200">
              النقاط
            </label>
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

          <div className="flex items-center gap-3 pt-8">
            <input
              id="is_active"
              name="is_active"
              type="checkbox"
              defaultChecked={question.is_active}
              className="h-5 w-5"
            />
            <label htmlFor="is_active" className="text-sm font-semibold text-slate-200">
              السؤال مفعّل
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