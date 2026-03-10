import Link from "next/link";
import { revalidatePath } from "next/cache";
import AdminEmptyState from "@/components/admin/admin-empty-state";
import AdminPageHeader from "@/components/admin/admin-page-header";
import { getSupabaseServerClient } from "@/lib/supabase/server";

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

function stripHtml(value: string | null) {
  if (!value) return "";
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function truncateText(value: string, maxLength = 140) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength)}...`;
}

async function deleteQuestion(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "");
  const supabase = await getSupabaseServerClient();

  await supabase.from("questions").delete().eq("id", id);

  revalidatePath("/admin/questions");
  revalidatePath("/game/board");
}

export default async function AdminQuestionsPage() {
  try {
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
      .from("questions")
      .select(
        `
          id,
          question_text,
          answer_text,
          points,
          is_active,
          is_used,
          categories ( name, slug )
        `
      )
      .order("created_at", { ascending: false });

    if (error) {
      return (
        <div className="rounded-[2rem] border border-red-500/20 bg-red-500/10 p-6 text-red-100">
          فشل تحميل الأسئلة: {error.message}
        </div>
      );
    }

    const questions = (data ?? []) as unknown as QuestionRow[];

    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="إدارة الأسئلة"
          description="راجع جميع الأسئلة، عدّلها أو احذفها، ويمكنك أيضًا رفع ملف أسئلة كامل بدل الإضافة اليدوية."
          action={
            <>
              <Link
                href="/admin/questions/import"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-orange-400/20 bg-orange-400/10 px-5 py-3 text-sm font-bold text-orange-100 transition hover:bg-orange-400/15"
              >
                رفع أسئلة بالجملة
              </Link>
              <Link
                href="/admin/questions/new"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-300"
              >
                إضافة سؤال جديد
              </Link>
            </>
          }
        />

        {questions.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {questions.map((question) => {
              const questionPreview = truncateText(stripHtml(question.question_text));
              const answerPreview = truncateText(stripHtml(question.answer_text));

              return (
                <div
                  key={question.id}
                  className="rounded-[1.75rem] border border-white/10 bg-slate-900/50 p-4 sm:p-5"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs text-cyan-300 sm:text-sm">سؤال</p>
                        <h3 className="mt-1 break-words text-xl font-black text-white sm:text-2xl">
                          {questionPreview || "بدون نص"}
                        </h3>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white">
                          {getCategoryName(question.categories)}
                        </span>
                        <span className="rounded-full border border-orange-400/20 bg-orange-400/10 px-3 py-1.5 text-xs font-bold text-orange-100">
                          {question.points} نقطة
                        </span>
                        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-bold text-cyan-200">
                          {question.is_active ? "مفعّل" : "غير مفعّل"}
                        </span>
                        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-200">
                          {question.is_used ? "مستخدم" : "غير مستخدم"}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3">
                      <p className="text-xs text-slate-400 sm:text-sm">الإجابة</p>
                      <p className="mt-2 break-words text-sm leading-7 text-white sm:text-base">
                        {answerPreview || "غير مضافة"}
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <Link
                        href={`/admin/questions/${question.id}/edit`}
                        className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-base font-bold text-white transition hover:bg-white/10"
                      >
                        تعديل
                      </Link>

                      <form action={deleteQuestion}>
                        <input type="hidden" name="id" value={question.id} />
                        <button
                          type="submit"
                          className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-3 text-base font-bold text-red-300 transition hover:bg-red-500/15"
                        >
                          حذف
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <AdminEmptyState
            title="لا توجد أسئلة"
            description="ابدأ بإضافة سؤال جديد أو استخدم صفحة رفع الأسئلة بالجملة."
          />
        )}
      </div>
    );
  } catch (error) {
    return (
      <div className="rounded-[2rem] border border-red-500/20 bg-red-500/10 p-6 text-red-100">
        فشل تحميل الأسئلة:{" "}
        {error instanceof Error ? error.message : "Unknown error"}
      </div>
    );
  }
}