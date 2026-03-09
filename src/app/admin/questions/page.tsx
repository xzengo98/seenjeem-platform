import AdminEmptyState from "@/components/admin/admin-empty-state";
import AdminPageHeader from "@/components/admin/admin-page-header";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type CategoryRelation =
  | {
      name: string;
      slug: string;
    }
  | {
      name: string;
      slug: string;
    }[]
  | null;

type QuestionRow = {
  id: string;
  question_text: string;
  difficulty: string;
  is_active: boolean;
  categories: CategoryRelation;
};

function getCategoryName(categories: CategoryRelation) {
  if (!categories) return "بدون فئة";
  if (Array.isArray(categories)) {
    return categories[0]?.name ?? "بدون فئة";
  }
  return categories.name;
}

export default async function AdminQuestionsPage() {
  try {
    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from("questions")
      .select(`
        id,
        question_text,
        difficulty,
        is_active,
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
          description="لاحقًا ستتمكن من إضافة الأسئلة وتعديلها واستيرادها من ملف."
          action={
            <a
              href="/admin/questions/new"
              className="rounded-2xl bg-cyan-400 px-5 py-3 font-bold text-slate-950"
            >
              إضافة سؤال
            </a>
          }
        />

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-4">
          <div className="grid gap-4 md:grid-cols-[1fr_220px_220px]">
            <input
              type="text"
              placeholder="ابحث عن سؤال..."
              className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
            />
            <select className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none">
              <option>كل الفئات</option>
            </select>
            <select className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none">
              <option>كل الصعوبات</option>
              <option>easy</option>
              <option>medium</option>
              <option>hard</option>
            </select>
          </div>
        </div>

        {questions.length > 0 ? (
          <div className="grid gap-4">
            {questions.map((question) => (
              <div
                key={question.id}
                className="rounded-[2rem] border border-white/10 bg-white/5 p-6"
              >
                <h3 className="text-xl font-black">{question.question_text}</h3>

                <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-300">
                  <span className="rounded-full bg-slate-900/70 px-3 py-1">
                    {getCategoryName(question.categories)}
                  </span>
                  <span className="rounded-full bg-slate-900/70 px-3 py-1">
                    {question.difficulty}
                  </span>
                  <span className="rounded-full bg-slate-900/70 px-3 py-1">
                    {question.is_active ? "مفعّل" : "غير مفعّل"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <AdminEmptyState
            title="لا توجد أسئلة بعد"
            description="بإمكانك إضافة الأسئلة يدويًا الآن، ثم لاحقًا سنضيف الاستيراد من ملف."
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