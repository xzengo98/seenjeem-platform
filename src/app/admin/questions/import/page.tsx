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

type RawImportItem = {
  [key: string]: unknown;
};

type InsertQuestionRow = {
  category_id: string;
  question_text: string;
  answer_text: string;
  points: number;
  is_active: boolean;
  is_used: boolean;
  media_type: string;
  media_url: string;
  year_tolerance_before: number;
  year_tolerance_after: number;
  question_image_url: string;
  question_video_url: string;
  answer_image_url: string;
  answer_video_url: string;
};

const CHUNK_SIZE = 200;

function normalizeLookup(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeSlug(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
  return fallback;
}

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function buildMessage(parts: string[]) {
  return parts.filter(Boolean).join(" | ");
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
  const {
    questionImageUrl,
    questionVideoUrl,
    answerImageUrl,
    answerVideoUrl,
  } = params;

  if (questionImageUrl) {
    return {
      media_type: "image",
      media_url: questionImageUrl,
    };
  }

  if (questionVideoUrl) {
    return {
      media_type: "video",
      media_url: questionVideoUrl,
    };
  }

  if (answerImageUrl) {
    return {
      media_type: "image",
      media_url: answerImageUrl,
    };
  }

  if (answerVideoUrl) {
    return {
      media_type: "video",
      media_url: answerVideoUrl,
    };
  }

  return {
    media_type: "",
    media_url: "",
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

export default async function AdminQuestionsImportPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
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

  const sections = (sectionsResult.data ?? []) as SectionRow[];
  const categories = (categoriesResult.data ?? []) as CategoryRow[];

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

    let items: RawImportItem[] = [];

    if (Array.isArray(parsed)) {
      items = parsed as RawImportItem[];
    } else if (
      parsed &&
      typeof parsed === "object" &&
      Array.isArray((parsed as { questions?: unknown[] }).questions)
    ) {
      items = (parsed as { questions: RawImportItem[] }).questions;
    } else {
      redirect(
        "/admin/questions/import?error=" +
          encodeURIComponent(
            'صيغة الملف غير صحيحة. ارفع إما Array مباشرة أو كائن يحتوي على "questions".'
          )
      );
    }

    if (items.length === 0) {
      redirect(
        "/admin/questions/import?error=" +
          encodeURIComponent("الملف لا يحتوي على أي أسئلة.")
      );
    }

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

    const sections = (sectionsResult.data ?? []) as SectionRow[];
    const categories = (categoriesResult.data ?? []) as CategoryRow[];

    const activeSections = sections.filter((item) => item.is_active !== false);
    const activeCategories = categories.filter((item) => item.is_active !== false);

    const sectionByName = new Map<string, SectionRow>();
    const sectionBySlug = new Map<string, SectionRow>();

    for (const section of activeSections) {
      sectionByName.set(normalizeLookup(section.name), section);

      if (section.slug) {
        sectionBySlug.set(normalizeLookup(section.slug), section);
        sectionBySlug.set(normalizeSlug(section.slug), section);
      }
    }

    function resolveSection(rawSection: string) {
      if (!rawSection) return null;

      return (
        sectionByName.get(normalizeLookup(rawSection)) ||
        sectionBySlug.get(normalizeLookup(rawSection)) ||
        sectionBySlug.get(normalizeSlug(rawSection)) ||
        null
      );
    }

    function resolveCategory(rawCategory: string, sectionId: string | null) {
      if (!rawCategory) return null;

      const scoped = sectionId
        ? activeCategories.filter((cat) => cat.section_id === sectionId)
        : activeCategories;

      const keyLookup = normalizeLookup(rawCategory);
      const keySlug = normalizeSlug(rawCategory);

      const scopedMatch =
        scoped.find(
          (cat) =>
            normalizeLookup(cat.name) === keyLookup ||
            (cat.slug && normalizeLookup(cat.slug) === keyLookup) ||
            (cat.slug && normalizeSlug(cat.slug) === keySlug)
        ) ?? null;

      if (scopedMatch) return scopedMatch;

      return (
        activeCategories.find(
          (cat) =>
            normalizeLookup(cat.name) === keyLookup ||
            (cat.slug && normalizeLookup(cat.slug) === keyLookup) ||
            (cat.slug && normalizeSlug(cat.slug) === keySlug)
        ) ?? null
      );
    }

    const invalidLines: string[] = [];
    const duplicateInsideFileLines: string[] = [];
    const preparedRows: InsertQuestionRow[] = [];
    const seenQuestionsInFile = new Set<string>();

    items.forEach((item, index) => {
      const lineNumber = index + 1;

      const sectionName = firstString(item, ["القسم", "section", "Section"]);
      const categoryName = firstString(item, ["الفئة", "category", "Category"]);
      const questionValue = firstString(item, [
        "السؤال",
        "question",
        "question_text",
      ]);
      const answerValue = firstString(item, [
        "الجواب",
        "answer",
        "answer_text",
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

      if (!sectionName || !categoryName || !questionValue || !answerValue) {
        invalidLines.push(
          `السطر ${lineNumber}: القسم أو الفئة أو السؤال أو الجواب ناقص.`
        );
        return;
      }

      const plainQuestionKey = normalizeLookup(stripHtml(questionValue));

      if (!plainQuestionKey) {
        invalidLines.push(`السطر ${lineNumber}: نص السؤال غير صالح.`);
        return;
      }

      if (seenQuestionsInFile.has(plainQuestionKey)) {
        duplicateInsideFileLines.push(`السطر ${lineNumber}: سؤال مكرر داخل الملف.`);
        return;
      }

      seenQuestionsInFile.add(plainQuestionKey);

      const points = toInt(pointsRaw, 0);

      if (![200, 400, 600].includes(points)) {
        invalidLines.push(
          `السطر ${lineNumber}: نقاط السؤال يجب أن تكون 200 أو 400 أو 600.`
        );
        return;
      }

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
        question_image_url: questionImageUrl,
        question_video_url: questionVideoUrl,
        answer_image_url: answerImageUrl,
        answer_video_url: answerVideoUrl,
      });
    });

    if (preparedRows.length === 0) {
      redirect(
        "/admin/questions/import?error=" +
          encodeURIComponent(
            buildMessage([
              "لم يتم العثور على أسئلة صالحة للرفع.",
              ...invalidLines.slice(0, 8),
              ...duplicateInsideFileLines.slice(0, 8),
            ])
          )
      );
    }

    const existingQuestionTexts = new Set<string>();

    for (const textChunk of chunkArray(
      preparedRows.map((row) => row.question_text),
      CHUNK_SIZE
    )) {
      const { data, error } = await supabase
        .from("questions")
        .select("question_text")
        .in("question_text", textChunk);

      if (error) {
        redirect(
          "/admin/questions/import?error=" +
            encodeURIComponent(
              error.message || "فشل التحقق من الأسئلة الموجودة مسبقًا."
            )
        );
      }

      for (const row of data ?? []) {
        const questionText =
          typeof row.question_text === "string" ? row.question_text : "";
        if (questionText) {
          existingQuestionTexts.add(questionText);
        }
      }
    }

    const rowsToInsert = preparedRows.filter(
      (row) => !existingQuestionTexts.has(row.question_text)
    );

    let insertedCount = 0;

    for (const insertChunk of chunkArray(rowsToInsert, CHUNK_SIZE)) {
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

  const sampleJson = `[
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
                رفع مبسط ومتوافق مع الجدول الحالي
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-8 text-slate-300 sm:text-base">
                الرفع الآن يعتمد على الأعمدة الموجودة فعليًا داخل جدول
                <span className="mx-1 font-bold text-white">questions</span>
                ويدعم الصور والفيديو والسماحية الزمنية إذا احتجتها.
              </p>
            </div>

            <div className="rounded-[1.35rem] border border-white/10 bg-white/5 px-4 py-4 text-center">
              <p className="text-xs text-slate-400">الصيغة المطلوبة</p>
              <p className="mt-2 text-2xl font-black text-white">JSON بسيط</p>
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

        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
            <h2 className="text-2xl font-black text-white">رفع الملف</h2>
            <p className="mt-2 text-sm leading-8 text-slate-300">
              اختر ملف JSON ثم اضغط رفع.
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
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
            <h3 className="text-xl font-black text-white">مثال جاهز</h3>

            <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-slate-950/80 p-4">
              <pre className="overflow-x-auto whitespace-pre-wrap text-xs leading-7 text-slate-200 sm:text-sm">
                {sampleJson}
              </pre>
            </div>

            <div className="mt-5 rounded-[1.5rem] border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm leading-7 text-cyan-100">
              الحقول الأساسية:
              <div className="mt-2 flex flex-wrap gap-2">
                {[
                  "القسم",
                  "الفئة",
                  "السؤال",
                  "الجواب",
                  "نقاط السؤال",
                  "صورة",
                ].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-cyan-300/20 bg-slate-950/40 px-3 py-1 text-xs font-bold text-cyan-100"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

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
        </section>
      </div>
    </main>
  );
}