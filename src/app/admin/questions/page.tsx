import Link from "next/link";
import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type CategorySectionRelation =
  | {
      id: string;
      name: string;
      slug: string;
    }
  | {
      id: string;
      name: string;
      slug: string;
    }[]
  | null;

type CategoryRelation =
  | {
      id: string;
      name: string;
      slug: string;
      category_sections?: CategorySectionRelation;
    }
  | {
      id: string;
      name: string;
      slug: string;
      category_sections?: CategorySectionRelation;
    }[]
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

type CategoryOption = {
  id: string;
  name: string;
  slug: string;
  section_id: string | null;
};

type SectionOption = {
  id: string;
  name: string;
  slug: string;
};

function getCategoryObject(categories: CategoryRelation) {
  if (!categories) return null;
  return Array.isArray(categories) ? (categories[0] ?? null) : categories;
}

function getSectionObject(section: CategorySectionRelation) {
  if (!section) return null;
  return Array.isArray(section) ? (section[0] ?? null) : section;
}

function getCategoryName(categories: CategoryRelation) {
  const category = getCategoryObject(categories);
  return category?.name ?? "بدون فئة";
}

function getSectionName(categories: CategoryRelation) {
  const category = getCategoryObject(categories);
  const section = getSectionObject(category?.category_sections ?? null);
  return section?.name ?? "بدون قسم";
}

function stripHtml(value: string | null) {
  if (!value) return "";
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function truncateText(value: string, maxLength = 140) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength)}...`;
}

function decodeHtml(value: string) {
  return value
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function extractFirstImageSrc(html: string | null | undefined) {
  if (!html) return null;
  const match = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
  if (!match?.[1]) return null;
  return decodeHtml(match[1].trim());
}

function buildReturnTo(params: {
  q: string;
  sectionId: string;
  categoryId: string;
}) {
  const query = new URLSearchParams();

  if (params.q) query.set("q", params.q);
  if (params.sectionId) query.set("section", params.sectionId);
  if (params.categoryId) query.set("category", params.categoryId);

  const queryString = query.toString();
  return queryString ? `/admin/questions?${queryString}` : "/admin/questions";
}

async function deleteQuestion(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "");
  const supabase = await getSupabaseServerClient();

  await supabase.from("questions").delete().eq("id", id);

  revalidatePath("/admin/questions");
  revalidatePath("/game/board");
}

export default async function AdminQuestionsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string;
    section?: string;
    category?: string;
  }>;
}) {
  try {
    const resolvedSearchParams = searchParams ? await searchParams : {};
    const q = resolvedSearchParams?.q?.trim() ?? "";
    const sectionId = resolvedSearchParams?.section?.trim() ?? "";
    const categoryId = resolvedSearchParams?.category?.trim() ?? "";
    const returnTo = buildReturnTo({ q, sectionId, categoryId });

    const supabase = await getSupabaseServerClient();

    const [{ data: sectionsData }, { data: categoriesData }, { data, error }] =
      await Promise.all([
        supabase
          .from("category_sections")
          .select("id, name, slug")
          .order("sort_order", { ascending: true }),
        supabase
          .from("categories")
          .select("id, name, slug, section_id")
          .order("sort_order", { ascending: true }),
        supabase
          .from("questions")
          .select(`
            id,
            question_text,
            answer_text,
            points,
            is_active,
            is_used,
            categories (
              id,
              name,
              slug,
              category_sections (
                id,
                name,
                slug
              )
            )
          `)
          .order("created_at", { ascending: false }),
      ]);

    if (error) {
      return (
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-red-100">
          فشل تحميل الأسئلة: {error.message}
        </div>
      );
    }

    const sections = (sectionsData ?? []) as SectionOption[];
    const categories = (categoriesData ?? []) as CategoryOption[];

    const questions = ((data ?? []) as unknown as QuestionRow[]).filter(
      (question) => {
        const category = getCategoryObject(question.categories);
        const section = getSectionObject(category?.category_sections ?? null);

        const matchesSearch =
          !q ||
          stripHtml(question.question_text)
            .toLowerCase()
            .includes(q.toLowerCase()) ||
          stripHtml(question.answer_text).toLowerCase().includes(q.toLowerCase());

        const matchesSection = !sectionId || section?.id === sectionId;
        const matchesCategory = !categoryId || category?.id === categoryId;

        return matchesSearch && matchesSection && matchesCategory;
      },
    );

    const filteredCategories = sectionId
      ? categories.filter((category) => category.section_id === sectionId)
      : categories;

    return (
      <div className="space-y-6">
        <section className="rounded-[2rem] border border-white/10 bg-[#071126] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-cyan-300">إدارة المحتوى</div>
              <h1 className="mt-2 text-4xl font-black text-white">
                إدارة الأسئلة
              </h1>
              <p className="mt-3 text-lg leading-8 text-white/75">
                فلتر الأسئلة بسرعة، راقب الصور داخل السؤال والإجابة، وعدّل أو احذف
                بدون فقدان الفلترة الحالية.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/questions/new"
                className="inline-flex items-center justify-center rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-400"
              >
                إضافة سؤال جديد
              </Link>

              <Link
                href="/admin/questions/import"
                className="inline-flex items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-3 text-sm font-bold text-amber-100 transition hover:bg-amber-500/20"
              >
                رفع أسئلة بالجملة
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-[#071126] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
          <form method="GET" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr_auto_auto]">
              <div>
                <label className="mb-2 block text-sm font-bold text-white">
                  البحث بنص السؤال
                </label>
                <input
                  type="text"
                  name="q"
                  defaultValue={q}
                  placeholder="اكتب جزءًا من السؤال..."
                  className="h-14 w-full rounded-2xl border border-white/10 bg-[#030b22] px-4 text-white outline-none placeholder:text-white/35 focus:border-cyan-400/40"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-white">
                  القسم
                </label>
                <select
                  name="section"
                  defaultValue={sectionId}
                  className="h-14 w-full rounded-2xl border border-white/10 bg-[#030b22] px-4 text-white outline-none focus:border-cyan-400/40"
                >
                  <option value="">كل الأقسام</option>
                  {sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-white">
                  الفئة
                </label>
                <select
                  name="category"
                  defaultValue={categoryId}
                  className="h-14 w-full rounded-2xl border border-white/10 bg-[#030b22] px-4 text-white outline-none focus:border-cyan-400/40"
                >
                  <option value="">كل الفئات</option>
                  {filteredCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="h-14 rounded-2xl bg-cyan-500 px-6 text-sm font-bold text-slate-950 transition hover:bg-cyan-400"
                >
                  بحث / فلترة
                </button>
              </div>

              <div className="flex items-end">
                <Link
                  href="/admin/questions"
                  className="inline-flex h-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  تصفير
                </Link>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
              <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-4 py-1.5 text-cyan-100">
                عدد النتائج: {questions.length}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5">
                الفلترة الحالية محفوظة داخل الرابط
              </span>
            </div>
          </form>
        </section>

        {questions.length > 0 ? (
          <section className="grid gap-5 xl:grid-cols-2">
            {questions.map((question) => {
              const questionPreview = truncateText(stripHtml(question.question_text));
              const answerPreview = truncateText(stripHtml(question.answer_text));
              const questionImage = extractFirstImageSrc(question.question_text);
              const answerImage = extractFirstImageSrc(question.answer_text);

              return (
                <article
                  key={question.id}
                  className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#071126] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.3)]"
                >
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-cyan-300">سؤال</div>
                      <h3 className="mt-2 text-3xl font-black leading-tight text-white">
                        {questionPreview || "بدون نص"}
                      </h3>
                    </div>
                  </div>

                  <div className="mb-4 flex flex-wrap gap-2">
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-bold text-white/90">
                      {getSectionName(question.categories)}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-bold text-white/90">
                      {getCategoryName(question.categories)}
                    </span>
                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-sm font-bold text-amber-100">
                      {question.points} نقطة
                    </span>
                    <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-sm font-bold text-cyan-100">
                      {question.is_active ? "مفعّل" : "غير مفعّل"}
                    </span>
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm font-bold text-emerald-100">
                      {question.is_used ? "مستخدم" : "غير مستخدم"}
                    </span>
                  </div>

                  {(questionImage || answerImage) && (
                    <div className="mb-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <div className="mb-2 text-sm font-bold text-white/80">
                          صورة السؤال
                        </div>
                        {questionImage ? (
                          <img
                            src={questionImage}
                            alt="صورة السؤال"
                            className="h-40 w-full rounded-2xl bg-[#030b22] object-contain"
                          />
                        ) : (
                          <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#030b22] text-sm text-white/45">
                            لا توجد صورة داخل السؤال
                          </div>
                        )}
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <div className="mb-2 text-sm font-bold text-white/80">
                          صورة الإجابة
                        </div>
                        {answerImage ? (
                          <img
                            src={answerImage}
                            alt="صورة الإجابة"
                            className="h-40 w-full rounded-2xl bg-[#030b22] object-contain"
                          />
                        ) : (
                          <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#030b22] text-sm text-white/45">
                            لا توجد صورة داخل الإجابة
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                    <div className="mb-2 text-right text-2xl font-black text-white/80">
                      الإجابة
                    </div>
                    <div className="text-2xl leading-10 text-white">
                      {answerPreview || "غير مضافة"}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <Link
                      href={`/admin/questions/edit/${question.id}?returnTo=${encodeURIComponent(returnTo)}`}
                      className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-lg font-bold text-white transition hover:bg-white/10"
                    >
                      تعديل
                    </Link>

                    <form action={deleteQuestion}>
                      <input type="hidden" name="id" value={question.id} />
                      <button
                        type="submit"
                        className="w-full rounded-2xl border border-red-500/25 bg-red-500/10 px-5 py-4 text-lg font-bold text-red-200 transition hover:bg-red-500/20"
                      >
                        حذف
                      </button>
                    </form>
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <div className="rounded-[2rem] border border-white/10 bg-[#071126] p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
            <h3 className="text-2xl font-black text-white">
              لا توجد أسئلة مطابقة
            </h3>
            <p className="mt-3 text-white/70">
              جرّب تغيير الفلترة أو إضافة سؤال جديد.
            </p>
            <div className="mt-5">
              <Link
                href="/admin/questions/new"
                className="inline-flex items-center justify-center rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-400"
              >
                إضافة سؤال جديد
              </Link>
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    return (
      <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-red-100">
        فشل تحميل الأسئلة:{" "}
        {error instanceof Error ? error.message : "Unknown error"}
      </div>
    );
  }
}