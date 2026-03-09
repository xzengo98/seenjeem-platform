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

async function createQuestion(formData: FormData) {
  "use server";

  const categoryId = String(formData.get("category_id") ?? "").trim();
  const questionText = String(formData.get("question_text") ?? "").trim();
  const answerText = String(formData.get("answer_text") ?? "").trim();
  const points = Number(formData.get("points") ?? 200);
  const isActive = formData.get("is_active") === "on";

  if (!categoryId || !questionText || !answerText) {
    throw new Error("الفئة والسؤال والإجابة مطلوبة.");
  }

  const supabase = getSupabaseServerClient();

  const { error } = await supabase.from("questions").insert({
    category_id: categoryId,
    question_text: questionText,
    answer_text: answerText,
    points: Number.isNaN(points) ? 200 : points,
    is_active: isActive,
    is_used: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/questions");
  redirect("/admin/questions");
}

export default async function NewQuestionPage() {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    return (
      <div className="space-y-8">
        <AdminPageHeader
          title="إضافة سؤال"
          description="حدث خطأ أثناء جلب الفئات من قاعدة البيانات."
        />
        <div className="rounded-[2rem] border border-red-500/20 bg-red-500/10 p-6 text-red-200">
          فشل تحميل الفئات: {error.message}
        </div>
      </div>
    );
  }

  const categories = (data ?? []) as Category[];

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="إضافة سؤال جديد"
        description="أضف سؤالًا شفهيًا مع الإجابة والنقاط واربطه بإحدى الفئات."
        action={
          <a
            href="/admin/questions"
            className="rounded-2xl border border-white/10 px-5 py-3 font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white"
          >
            الرجوع للأسئلة
          </a>
        }
      />

      <form
        action={createQuestion}
        className="rounded-[2rem] border border-white/10 bg-white/5 p-6"
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-bold text-slate-200">
              نص السؤال
            </label>
            <textarea
              name="question_text"
              placeholder="اكتب السؤال هنا"
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
              placeholder="اكتب الإجابة الصحيحة هنا"
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
              defaultValue=""
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
            >
              <option value="" disabled>
                اختر الفئة
              </option>
              {categories.map((category) => (
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
              defaultValue="200"
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
              defaultChecked
              className="h-5 w-5"
            />
            <label
              htmlFor="is_active"
              className="text-sm font-semibold text-slate-200"
            >
              السؤال مفعّل
            </label>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          <button
            type="submit"
            className="rounded-2xl bg-cyan-400 px-6 py-3 font-bold text-slate-950"
          >
            حفظ السؤال
          </button>

          <a
            href="/admin/questions"
            className="rounded-2xl border border-white/10 px-6 py-3 font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white"
          >
            إلغاء
          </a>
        </div>
      </form>
    </div>
  );
}