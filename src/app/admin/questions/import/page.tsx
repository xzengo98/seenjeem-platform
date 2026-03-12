import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  success?: string;
  error?: string;
  warning?: string;
}>;

type ProfileRow = {
  role: string | null;
};

type SectionRow = {
  id: string;
  name: string;
  slug: string | null;
  is_active: boolean | null;
};

type CategoryRow = {
  id: string;
  name: string;
  slug: string | null;
  section_id: string | null;
  is_active: boolean | null;
};

type RawImportItem = Record<string, unknown>;

type PreparedQuestionRow = {
  category_id: string;
  question_text: string;
  answer_text: string;
  points: number;
  is_active: boolean;
  is_used: boolean;
  media_type: "image" | "video" | null;
  media_url: string | null;
  year_tolerance_before: number;
  year_tolerance_after: number;
  question_image_url: string | null;
  question_video_url: string | null;
  answer_image_url: string | null;
  answer_video_url: string | null;
};

const INSERT_CHUNK_SIZE = 200;

function normalizeLookup(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeSlug(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeQuestionKey(value: string) {
  return stripHtml(value).toLowerCase().replace(/\s+/g, " ").trim();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function ensureHtmlParagraph(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/<[a-z][\s\S]*>/i.test(trimmed)) {
    return trimmed;
  }
  return `<p>${escapeHtml(trimmed)}</p>`;
}

function toStringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function nullableString(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function toInt(value: unknown, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? Math.trunc(num) : fallback;
}

function toBool(value: unknown, fallback = true) {
  if (typeof value === "boolean") return value;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "y", "نعم"].includes(normalized)) return true;
    if (["false", "0", "no", "n", "لا"].includes(normalized)) return false;
  }

  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
  }

  return fallback;
}

function buildMessage(parts: string[]) {
  return parts.filter(Boolean).join(" | ");
}

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function firstString(item: RawImportItem, keys: string[]) {
  for (const key of keys) {
    const value = toStringValue(item[key]);
    if (value) return value;
  }
  return "";
}

function resolveMediaFields(params: {
  questionImageUrl: string;
  questionVideoUrl: string;
  answerImageUrl: string;
  answerVideoUrl: string;
}) {
  const questionImageUrl = params.questionImageUrl.trim();
  const questionVideoUrl = params.questionVideoUrl.trim();
  const answerImageUrl = params.answerImageUrl.trim();
  const answerVideoUrl = params.answerVideoUrl.trim();

  if (questionImageUrl) {
    return {
      media_type: "image" as const,
      media_url: questionImageUrl,
    };
  }

  if (questionVideoUrl) {
    return {
      media_type: "video" as const,
      media_url: questionVideoUrl,
    };
  }

  if (answerImageUrl) {
    return {
      media_type: "image" as const,
      media_url: answerImageUrl,
    };
  }

  if (answerVideoUrl) {
    return {
      media_type: "video" as const,
      media_url: answerVideoUrl,
    };
  }

  return {
    media_type: null,
    media_url: null,
  };
}

async function requireAdmin() {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const typedProfile = profile as ProfileRow | null;

  if (typedProfile?.role !== "admin") {
    redirect("/");
  }

  return { supabase, user };
}

async function getActiveSectionsAndCategories() {
  const { supabase } = await requireAdmin();

  const [sectionsResult, categoriesResult] = await Promise.all([
    supabase
      .from("category_sections")
      .select("id, name, slug, is_active")
      .order("sort_order", { ascending: true }),
    supabase
      .from("categories")
      .select("id, name, slug, section_id, is_active")
      .order("sort_order", { ascending: true }),
  ]);

  const sections = ((sectionsResult.data ?? []) as SectionRow[]).filter(
    (item) => item.is_active !== false
  );

  const categories = ((categoriesResult.data ?? []) as CategoryRow[]).filter(
    (item) => item.is_active !== false
  );

  return { sections, categories };
}

function createResolvers(sections: SectionRow[], categories: CategoryRow[]) {
  const sectionByLookup = new Map<string, SectionRow>();

  for (const section of sections) {
    sectionByLookup.set(normalizeLookup(section.name), section);

    if (section.slug) {
      sectionByLookup.set(normalizeLookup(section.slug), section);
      sectionByLookup.set(normalizeSlug(section.slug), section);
    }
  }

  function resolveSection(rawSection: string) {
    if (!rawSection) return null;
    return (
      sectionByLookup.get(normalizeLookup(rawSection)) ||
      sectionByLookup.get(normalizeSlug(rawSection)) ||
      null
    );
  }

  function resolveCategory(rawCategory: string, sectionId: string | null) {
    if (!rawCategory) return null;

    const keyLookup = normalizeLookup(rawCategory);
    const keySlug = normalizeSlug(rawCategory);

    const scopedCategories = sectionId
      ? categories.filter((cat) => cat.section_id === sectionId)
      : categories;

    const scopedMatch =
      scopedCategories.find((cat) => {
        const catName = normalizeLookup(cat.name);
        const catSlugLookup = cat.slug ? normalizeLookup(cat.slug) : "";
        const catSlug = cat.slug ? normalizeSlug(cat.slug) : "";

        return (
          catName === keyLookup ||
          catSlugLookup === keyLookup ||
          catSlug === keySlug
        );
      }) ?? null;

    if (scopedMatch) return scopedMatch;

    return (
      categories.find((cat) => {
        const catName = normalizeLookup(cat.name);
        const catSlugLookup = cat.slug ? normalizeLookup(cat.slug) : "";
        const catSlug = cat.slug ? normalizeSlug(cat.slug) : "";

        return (
          catName === keyLookup ||
          catSlugLookup === keyLookup ||
          catSlug === keySlug
        );
      }) ?? null
    );
  }

  return { resolveSection, resolveCategory };
}

function parseJsonInput(parsed: unknown): RawImportItem[] | null {
  if (Array.isArray(parsed)) {
    return parsed as RawImportItem[];
  }

  if (
    parsed &&
    typeof parsed === "object" &&
    Array.isArray((parsed as { questions?: unknown[] }).questions)
  ) {
    return (parsed as { questions: RawImportItem[] }).questions;
  }

  return null;
}

function extractQuestionFields(item: RawImportItem) {
  const sectionName = firstString(item, ["القسم", "section", "Section"]);
  const categoryName = firstString(item, ["الفئة", "category", "Category"]);

  const questionValue = firstString(item, [
    "السؤال",
    "question",
    "question_text",
    "Question",
  ]);

  const answerValue = firstString(item, [
    "الجواب",
    "answer",
    "answer_text",
    "Answer",
  ]);

  const questionImageUrl = firstString(item, [
    "صورة",
    "question_image_url",
    "image",
    "image_url",
  ]);

  const questionVideoUrl = firstString(item, [
    "فيديو السؤال",
    "question_video_url",
  ]);

  const answerImageUrl = firstString(item, [
    "صورة الجواب",
    "answer_image_url",
  ]);

  const answerVideoUrl = firstString(item, [
    "فيديو الجواب",
    "answer_video_url",
  ]);

  const pointsRaw =
    item["نقاط السؤال"] ??
    item["points"] ??
    item["النقاط"] ??
    item["Points"] ??
    0;

  const isActiveRaw =
    item["نشط"] ??
    item["is_active"] ??
    item["active"] ??
    true;

  const yearToleranceBeforeRaw =
    item["سماحية قبل"] ??
    item["year_tolerance_before"] ??
    item["before_tolerance"] ??
    0;

  const yearToleranceAfterRaw =
    item["سماحية بعد"] ??
    item["year_tolerance_after"] ??
    item["after_tolerance"] ??
    0;

  return {
    sectionName,
    categoryName,
    questionValue,
    answerValue,
    questionImageUrl,
    questionVideoUrl,
    answerImageUrl,
    answerVideoUrl,
    pointsRaw,
    isActiveRaw,
    yearToleranceBeforeRaw,
    yearToleranceAfterRaw,
  };
}

export default async function AdminQuestionsImportPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  await requireAdmin();

  async function importQuestionsAction(formData: FormData) {
    "use server";

    const { supabase } = await requireAdmin();

    const file = formData.get("file");

    if (!(file instanceof File)) {
      redirect(
        "/admin/questions/import?error=" +
          encodeURIComponent("يرجى اختيار ملف JSON صالح.")
      );
    }

    let rawText = "";

    try {
      rawText = await file.text();
    } catch {
      redirect(
        "/admin/questions/import?error=" +
          encodeURIComponent("تعذر قراءة الملف المرفوع.")
      );
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(rawText);
    } catch {
      redirect(
        "/admin/questions/import?error=" +
          encodeURIComponent("الملف ليس JSON صالحًا.")
      );
    }

    const items = parseJsonInput(parsed);

    if (!items) {
      redirect(
        "/admin/questions/import?error=" +
          encodeURIComponent(
            'صيغة الملف غير صحيحة. ارفع Array مباشرة أو كائن يحتوي على "questions".'
          )
      );
    }

    if (items.length === 0) {
      redirect(
        "/admin/questions/import?error=" +
          encodeURIComponent("الملف لا يحتوي على أي أسئلة.")
      );
    }

    const { sections, categories } = await getActiveSectionsAndCategories();
    const { resolveSection, resolveCategory } = createResolvers(
      sections,
      categories
    );

    const invalidLines: string[] = [];
    const duplicateInsideFileLines: string[] = [];
    const seenQuestionsInFile = new Set<string>();
    const preparedRows: PreparedQuestionRow[] = [];

    items.forEach((item, index) => {
      const lineNumber = index + 1;

      const {
        sectionName,
        categoryName,
        questionValue,
        answerValue,
        questionImageUrl,
        questionVideoUrl,
        answerImageUrl,
        answerVideoUrl,
        pointsRaw,
        isActiveRaw,
        yearToleranceBeforeRaw,
        yearToleranceAfterRaw,
      } = extractQuestionFields(item);

      if (!sectionName || !categoryName || !questionValue || !answerValue) {
        invalidLines.push(
          `السطر ${lineNumber}: القسم أو الفئة أو السؤال أو الجواب ناقص.`
        );
        return;
      }

      const normalizedQuestion = normalizeQuestionKey(questionValue);

      if (!normalizedQuestion) {
        invalidLines.push(`السطر ${lineNumber}: نص السؤال غير صالح.`);
        return;
      }

      if (seenQuestionsInFile.has(normalizedQuestion)) {
        duplicateInsideFileLines.push(
          `السطر ${lineNumber}: سؤال مكرر داخل الملف.`
        );
        return;
      }

      seenQuestionsInFile.add(normalizedQuestion);

      const section = resolveSection(sectionName);
      if (!section) {
        invalidLines.push(`السطر ${lineNumber}: القسم "${sectionName}" غير موجود.`);
        return;
      }

      const category = resolveCategory(categoryName, section.id);
      if (!category) {
        invalidLines.push(
          `السطر ${lineNumber}: الفئة "${categoryName}" غير موجودة داخل القسم "${sectionName}".`
        );
        return;
      }

      const points = toInt(pointsRaw, 0);
      if (![200, 400, 600].includes(points)) {
        invalidLines.push(
          `السطر ${lineNumber}: نقاط السؤال يجب أن تكون 200 أو 400 أو 600.`
        );
        return;
      }

      const media = resolveMediaFields({
        questionImageUrl,
        questionVideoUrl,
        answerImageUrl,
        answerVideoUrl,
      });

      preparedRows.push({
        category_id: category.id,
        question_text: ensureHtmlParagraph(questionValue),
        answer_text: ensureHtmlParagraph(answerValue),
        points,
        is_active: toBool(isActiveRaw, true),
        is_used: false,
        media_type: media.media_type,
        media_url: media.media_url,
        year_tolerance_before: Math.max(0, toInt(yearToleranceBeforeRaw, 0)),
        year_tolerance_after: Math.max(0, toInt(yearToleranceAfterRaw, 0)),
        question_image_url: nullableString(questionImageUrl),
        question_video_url: nullableString(questionVideoUrl),
        answer_image_url: nullableString(answerImageUrl),
        answer_video_url: nullableString(answerVideoUrl),
      });
    });

    if (preparedRows.length === 0) {
      const errorMessage = buildMessage([
        "لم يتم العثور على أسئلة صالحة للرفع.",
        ...invalidLines.slice(0, 8),
        ...duplicateInsideFileLines.slice(0, 8),
      ]);

      redirect(
        "/admin/questions/import?error=" + encodeURIComponent(errorMessage)
      );
    }

    const categoryIds = Array.from(new Set(preparedRows.map((row) => row.category_id)));

    const existingNormalizedQuestions = new Set<string>();

    for (const categoryChunk of chunkArray(categoryIds, 50)) {
      const { data, error } = await supabase
        .from("questions")
        .select("question_text, category_id")
        .in("category_id", categoryChunk);

      if (error) {
        redirect(
          "/admin/questions/import?error=" +
            encodeURIComponent(
              error.message || "فشل التحقق من الأسئلة الموجودة مسبقًا."
            )
        );
      }

      for (const row of data ?? []) {
        const text =
          typeof row.question_text === "string" ? row.question_text : "";
        const normalized = normalizeQuestionKey(text);
        if (normalized) {
          existingNormalizedQuestions.add(normalized);
        }
      }
    }

    const rowsToInsert = preparedRows.filter((row) => {
      const key = normalizeQuestionKey(row.question_text);
      return !existingNormalizedQuestions.has(key);
    });

    let insertedCount = 0;

    for (const insertChunk of chunkArray(rowsToInsert, INSERT_CHUNK_SIZE)) {
      const { data, error } = await supabase
  .from("questions")
  .insert(insertChunk)
  .select("id");

      if (error) {
        redirect(
          "/admin/questions/import?error=" +
            encodeURIComponent(error.message || "فشل رفع دفعة من الأسئلة.")
        );
      }

      insertedCount += data?.length ?? 0;
    }

    const skippedExistingCount = preparedRows.length - rowsToInsert.length;

    revalidatePath("/admin/questions");
    revalidatePath("/admin/questions/import");
    revalidatePath("/admin/games");
    revalidatePath("/game/start");

    const successMessage = buildMessage([
      `تم رفع ${insertedCount} سؤال بنجاح.`,
      skippedExistingCount > 0
        ? `تم تخطي ${skippedExistingCount} سؤال موجود مسبقًا.`
        : "",
      duplicateInsideFileLines.length > 0
        ? `تم تخطي ${duplicateInsideFileLines.length} سؤال مكرر داخل الملف.`
        : "",
      invalidLines.length > 0
        ? `تم تخطي ${invalidLines.length} سطر غير صالح.`
        : "",
    ]);

    const warningMessage = buildMessage([
      ...duplicateInsideFileLines.slice(0, 5),
      ...invalidLines.slice(0, 5),
    ]);

    const query = new URLSearchParams();
    query.set("success", successMessage);

    if (warningMessage) {
      query.set("warning", warningMessage);
    }

    redirect(`/admin/questions/import?${query.toString()}`);
  }

  const sampleSimpleJson = `[
  {
    "القسم": "عام",
    "الفئة": "أمثال شعبية",
    "السؤال": "أكمل المثل الشعبي: اللي اختشوا ...",
    "الجواب": "ماتوا",
    "نقاط السؤال": 200,
    "صورة": ""
  },
  {
    "القسم": "عام",
    "الفئة": "شعارات",
    "السؤال": "هذا الشعار يعود لأي تطبيق؟",
    "الجواب": "واتساب",
    "نقاط السؤال": 400,
    "صورة": "https://example.com/logo.png"
  }
]`;

  const sampleFullJson = `{
  "questions": [
    {
      "section": "عام",
      "category": "ألغاز",
      "points": 200,
      "is_active": true,
      "year_tolerance_before": 0,
      "year_tolerance_after": 0,
      "question_text": "<p>ما الشيء الذي يكتب ولا يقرأ؟</p>",
      "answer_text": "<p>القلم</p>",
      "question_image_url": "",
      "question_video_url": "",
      "answer_image_url": "",
      "answer_video_url": ""
    }
  ]
}`;

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6 lg:px-8 lg:py-10"
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,#020617_0%,#07143a_50%,#020617_100%)] p-5 sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-bold text-cyan-200 sm:text-sm">
                  إدارة المحتوى
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 sm:text-sm">
                  رفع أسئلة بالجملة
                </span>
              </div>

              <h1 className="mt-4 text-3xl font-black sm:text-4xl">
                رفع ملفات الأسئلة
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-8 text-slate-300 sm:text-base">
           صفحة لرفع الملفات دفعة واحدة 
              </p>
            </div>

            <div className="rounded-[1.35rem] border border-white/10 bg-white/5 px-4 py-4 text-center">
              <p className="text-xs text-slate-400">الحالة</p>
              <p className="mt-2 text-2xl font-black text-white">جاهز للرفع</p>
            </div>
          </div>
        </section>

        {params.success ? (
          <div className="rounded-[1.5rem] border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-100 sm:text-base">
            {params.success}
          </div>
        ) : null}

        {params.warning ? (
          <div className="rounded-[1.5rem] border border-amber-500/20 bg-amber-500/10 px-5 py-4 text-sm text-amber-100 sm:text-base">
            {params.warning}
          </div>
        ) : null}

        {params.error ? (
          <div className="rounded-[1.5rem] border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-100 sm:text-base">
            {params.error}
          </div>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
            <h2 className="text-2xl font-black text-white">رفع الملف</h2>
            <p className="mt-2 text-sm leading-8 text-slate-300">
              ارفع ملف JSON، والصفحة ستتحقق من الصيغة، الأقسام، الفئات، النقاط،
              التكرار، والوسائط قبل الإدخال.
            </p>

            <form action={importQuestionsAction} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-white">
                  ملف JSON
                </label>
                <input
                  type="file"
                  name="file"
                  accept=".json,application/json"
                  className="block w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-4 text-sm text-white file:ml-4 file:rounded-xl file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:text-sm file:font-bold file:text-slate-950"
                  required
                />
              </div>

              <button
                type="submit"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-cyan-400 px-6 py-3 text-base font-black text-slate-950 transition hover:bg-cyan-300"
              >
                ارفع الملف الآن
              </button>
            </form>

            <div className="mt-6 rounded-[1.5rem] border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm leading-7 text-emerald-100">
              ما الذي يتم التحقق منه؟
              <ul className="mt-3 space-y-2 text-sm">
                <li>وجود القسم والفئة والسؤال والجواب</li>
                <li>أن النقاط 200 أو 400 أو 600 فقط</li>
                <li>التأكد من القسم والفئة داخل قاعدة البيانات</li>
                <li>تخطي المكرر داخل الملف</li>
                <li>تخطي السؤال الموجود مسبقًا</li>
                <li>مطابقة الوسائط مع media_type و media_url بشكل صحيح</li>
              </ul>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
              <h3 className="text-xl font-black text-white">مثال الصيغة المبسطة</h3>

              <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-slate-950/80 p-4">
                <pre className="overflow-x-auto whitespace-pre-wrap text-xs leading-7 text-slate-200 sm:text-sm">
                  {sampleSimpleJson}
                </pre>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
              <h3 className="text-xl font-black text-white">مثال صيغة اخر مقبول</h3>

              <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-slate-950/80 p-4">
                <pre className="overflow-x-auto whitespace-pre-wrap text-xs leading-7 text-slate-200 sm:text-sm">
                  {sampleFullJson}
                </pre>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
              <h3 className="text-xl font-black text-white">تنبيه مهم</h3>
              <p className="mt-3 text-sm leading-8 text-slate-300">
               إذا لم توجد صورة أو فيديو،ليس هنالك اي مشاكل
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/admin/questions"
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  الرجوع للأسئلة
                </Link>

                <Link
                  href="/admin"
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  الرجوع للإدارة
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}