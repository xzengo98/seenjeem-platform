import AdminEmptyState from "@/components/admin/admin-empty-state";
import AdminPageHeader from "@/components/admin/admin-page-header";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

type CategoryRelation =
  | { name: string; slug: string }
  | { name: string; slug: string }[]
  | null;

type QuestionRow = {
  id: string;
  question_text: string;
  answer_text: string | null;
  points: number;
  is_active: boolean;
  is_used: boolean;
  categories: CategoryRelation;
};

function getCategoryName(categories: CategoryRelation) {
  if (!categories) return "بدون فئة";
  if (Array.isArray(categories)) return categories[0]?.name ?? "بدون فئة";
  return categories.name;
}

async function deleteQuestion(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "");
  const supabase = getSupabaseServerClient();

  await supabase.from("questions").delete().eq("id", id);

  revalidatePath("/admin/questions");
  revalidatePath("/game/board");
}

export default async function AdminQuestionsPage() {
  try {
    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from("questions")
      .select(`
        id,
        question_text,
        answer_text,
        points,
        is_active,
        is_used,
        categories (
          name,
          slug
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      return (
        <div className="space-y-8">
          <AdminPageHeader
            title="إدارة الأسئلة"
            description="حدث خطأ أثناء جلب الأسئلة من قاعدة البيانات."
          />
          <div className="rounded-[2rem] border border-red-500/20 bg-red-500/10 p-6 text-red-200">
            فشل تحميل الأسئلة: {error.message}
          </div>
        </div>
      );
    }

    const questions = (data ?? []) as unknown as QuestionRow[];

    return (
      <div className="space-y-8">
        <AdminPageHeader
          title="إدارة الأسئلة"
          description="إدارة الأسئلة والإجابات والنقاط الخاصة باللعبة."
          action={
            <a
              href="/admin/questions/new"
              className="rounded-2xl bg-cyan-400 px-5 py-3 font-bold text-slate-950"
            >
              إضافة سؤال
            </a>
          }
        />

        {questions.length > 0 ? (
          <div className="grid gap-4">
            {questions.map((question) => (
              <div
                key={question.id}
                className="rounded-[2rem] border border-white/10 bg-white/5 p-6"
              >
                <h3 className="text-xl font-black">{question.question_text}</h3>

                <p className="mt-3 text-slate-300">
                  الإجابة: {question.answer_text ?? "غير مضافة"}
                </p>

                <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-300">
                  <span className="rounded-full bg-slate-900/70 px-3 py-1">
                    {getCategoryName(question.categories)}
                  </span>
                  <span className="rounded-full bg-slate-900/70 px-3 py-1">
                    {question.points} نقطة
                  </span>
                  <span className="rounded-full bg-slate-900/70 px-3 py-1">
                    {question.is_active ? "مفعّل" : "غير مفعّل"}
                  </span>
                  <span className="rounded-full bg-slate-900/70 px-3 py-1">
                    {question.is_used ? "مستخدم" : "غير مستخدم"}
                  </span>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href={`/admin/questions/edit/${question.id}`}
                    className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 font-semibold text-cyan-300"
                  >
                    تعديل
                  </a>

                  <form action={deleteQuestion}>
                    <input type="hidden" name="id" value={question.id} />
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
            title="لا توجد أسئلة بعد"
            description="أضف أول سؤال شفهي مع الإجابة والنقاط."
            buttonText="إضافة أول سؤال"
          />
        )}
      </div>
    );
  } catch (error) {
    return (
      <div className="space-y-8">
        <AdminPageHeader
          title="إدارة الأسئلة"
          description="حدث خطأ أثناء جلب البيانات من قاعدة البيانات."
        />
        <div className="rounded-[2rem] border border-red-500/20 bg-red-500/10 p-6 text-red-200">
          فشل تحميل الأسئلة:{" "}
          {error instanceof Error ? error.message : "Unknown error"}
        </div>
      </div>
    );
  }
}