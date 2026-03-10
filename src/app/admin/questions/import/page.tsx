import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import AdminPageHeader from "@/components/admin/admin-page-header";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  error?: string;
  success?: string;
}>;

type CategoryRelation =
  | { name: string; slug: string }
  | { name: string; slug: string }[]
  | null;

type CategoryLookupRow = {
  id: string;
  name: string;
  slug: string;
  category_sections: CategoryRelation;
};

type UploadQuestionRow = {
  section?: string;
  section_name?: string;
  section_slug?: string;
  category?: string;
  category_name?: string;
  category_slug?: string;
  points?: number;
  is_active?: boolean | string;
  year_tolerance_before?: number;
  year_tolerance_after?: number;
  question_text?: string;
  question?: string;
  question_html?: string;
  answer_text?: string;
  answer?: string;
  answer_html?: string;
  question_image_url?: string;
  question_video_url?: string;
  answer_image_url?: string;
  answer_video_url?: string;
};

const sampleJson = `{
  "questions": [
    {
      "section": "عام",
      "category": "الحياة",
      "points": 200,
      "is_active": true,
      "year_tolerance_before": 0,
      "year_tolerance_after": 0,
      "question_text": "<p>ما اسم اللعبة الشعبية الظاهرة في الصورة؟</p>",
      "answer_text": "<p>الجواب هنا</p>",
      "question_image_url": "https://example.com/question-image.jpg",
      "question_video_url": "",
      "answer_image_url": "",
      "answer_video_url": ""
    },
    {
      "section_slug": "general",
      "category_slug": "life",
      "points": 400,
      "is_active": true,
      "year_tolerance_before": 1,
      "year_tolerance_after": 1,
      "question_text": "<p>اكتب نص السؤال هنا</p>",
      "answer_text": "<p>اكتب الجواب هنا</p>",
      "question_image_url": "",
      "question_video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "answer_image_url": "",
      "answer_video_url": ""
    }
  ]
}`;

function getSectionName(section: CategoryRelation) {
  if (!section) return "بدون قسم";
  if (Array.isArray(section)) return section[0]?.name ?? "بدون قسم";
  return section.name;
}

function getSectionSlug(section: CategoryRelation) {
  if (!section) return "";
  if (Array.isArray(section)) return section[0]?.slug ?? "";
  return section.slug;
}

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeBool(value: unknown, fallback = true) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["false", "0", "off", "no"].includes(normalized)) return false;
    if (["true", "1", "on", "yes"].includes(normalized)) return true;
  }
  return fallback;
}

function normalizePoints(value: unknown) {
  const numeric = Number(value ?? 200);
  if (numeric === 400 || numeric === 600) return numeric;
  return 200;
}

function normalizeTolerance(value: unknown) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric) || numeric < 0) return 0;
  return Math.floor(numeric);
}

function escapeAttribute(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function toYouTubeEmbed(url: string) {
  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("youtube.com")) {
      const v = parsed.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
    }

    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.replace("/", "");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
  } catch {}

  return url;
}

function appendMediaHtml(baseHtml: string, imageUrl: string, videoUrl: string) {
  const parts: string[] = [];

  if (baseHtml) {
    parts.push(baseHtml);
  }

  if (imageUrl) {
    parts.push(
      `<p><img src="${escapeAttribute(imageUrl)}" alt="" /></p>`
    );
  }

  if (videoUrl) {
    const embed = toYouTubeEmbed(videoUrl);

    if (embed.includes("youtube.com/embed/")) {
      parts.push(
        `<div class="video-wrap"><iframe src="${escapeAttribute(
          embed
        )}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`
      );
    } else {
      parts.push(
        `<p><video src="${escapeAttribute(
          embed
        )}" controls playsinline></video></p>`
      );
    }
  }

  return parts.join("\n\n").trim();
}

export default async function AdminImportQuestionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
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

  if (!profile || profile.role !== "admin") {
    redirect("/");
  }

  const { data: categoriesData } = await supabase
    .from("categories")
    .select(
      `
        id,
        name,
        slug,
        category_sections ( name, slug )
      `
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const categories = (categoriesData ?? []) as unknown as CategoryLookupRow[];

  async function importQuestions(formData: FormData) {
    "use server";

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

    if (!profile || profile.role !== "admin") {
      redirect("/");
    }

    const file = formData.get("data_file");

    if (!(file instanceof File) || file.size === 0) {
      redirect(
        "/admin/questions/import?error=" +
          encodeURIComponent("يرجى اختيار ملف JSON صالح.")
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      redirect(
        "/admin/questions/import?error=" +
          encodeURIComponent("حجم الملف كبير جدًا. الحد الأقصى 5MB.")
      );
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(await file.text());
    } catch {
      redirect(
        "/admin/questions/import?error=" +
          encodeURIComponent("تعذر قراءة الملف. تأكد أنه JSON صحيح.")
      );
    }

    const rawItems = Array.isArray(parsed)
      ? parsed
      : parsed &&
        typeof parsed === "object" &&
        Array.isArray((parsed as { questions?: unknown[] }).questions)
      ? (parsed as { questions: unknown[] }).questions
      : [];

    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      redirect(
        "/admin/questions/import?error=" +
          encodeURIComponent("الملف لا يحتوي على أسئلة قابلة للرفع.")
      );
    }

    if (rawItems.length > 500) {
      redirect(
        "/admin/questions/import?error=" +
          encodeURIComponent("الحد الأقصى في كل رفعه هو 500 سؤال.")
      );
    }

    const { data: categoriesData, error: categoriesError } = await supabase
      .from("categories")
      .select(
        `
          id,
          name,
          slug,
          category_sections ( name, slug )
        `
      )
      .eq("is_active", true);

    if (categoriesError) {
      redirect(
        "/admin/questions/import?error=" +
          encodeURIComponent(categoriesError.message)
      );
    }

    const categories = (categoriesData ?? []) as unknown as CategoryLookupRow[];

    const findCategory = (identifier: string) => {
      const normalized = identifier.trim().toLowerCase();

      return categories.find(
        (category) =>
          category.slug.trim().toLowerCase() === normalized ||
          category.name.trim().toLowerCase() === normalized
      );
    };

    const insertRows: Array<{
      question_text: string;
      answer_text: string;
      category_id: string;
      points: number;
      is_active: boolean;
      year_tolerance_before: number;
      year_tolerance_after: number;
      media_type: string;
      media_url: null;
    }> = [];

    const validationErrors: string[] = [];

    rawItems.forEach((item, index) => {
      const row = (item ?? {}) as UploadQuestionRow;
      const line = index + 1;

      const sectionIdentifier = normalizeString(
        row.section_slug ?? row.section_name ?? row.section
      );
      const categoryIdentifier = normalizeString(
        row.category_slug ?? row.category_name ?? row.category
      );

      const questionBase = normalizeString(
        row.question_text ?? row.question_html ?? row.question
      );
      const answerBase = normalizeString(
        row.answer_text ?? row.answer_html ?? row.answer
      );

      if (!questionBase || !answerBase || !categoryIdentifier) {
        validationErrors.push(
          `السطر ${line}: السؤال والجواب والفئة حقول مطلوبة.`
        );
        return;
      }

      const category = findCategory(categoryIdentifier);

      if (!category) {
        validationErrors.push(
          `السطر ${line}: تعذر العثور على الفئة "${categoryIdentifier}".`
        );
        return;
      }

      if (sectionIdentifier) {
        const sectionName = getSectionName(category.category_sections)
          .trim()
          .toLowerCase();
        const sectionSlug = getSectionSlug(category.category_sections)
          .trim()
          .toLowerCase();
        const expected = sectionIdentifier.trim().toLowerCase();

        if (sectionName !== expected && sectionSlug !== expected) {
          validationErrors.push(
            `السطر ${line}: الفئة "${category.name}" لا تنتمي إلى القسم "${sectionIdentifier}".`
          );
          return;
        }
      }

      const questionText = appendMediaHtml(
        questionBase,
        normalizeString(row.question_image_url),
        normalizeString(row.question_video_url)
      );

      const answerText = appendMediaHtml(
        answerBase,
        normalizeString(row.answer_image_url),
        normalizeString(row.answer_video_url)
      );

      insertRows.push({
        question_text: questionText,
        answer_text: answerText,
        category_id: category.id,
        points: normalizePoints(row.points),
        is_active: normalizeBool(row.is_active, true),
        year_tolerance_before: normalizeTolerance(row.year_tolerance_before),
        year_tolerance_after: normalizeTolerance(row.year_tolerance_after),
        media_type: "none",
        media_url: null,
      });
    });

    if (validationErrors.length > 0) {
      redirect(
        "/admin/questions/import?error=" +
          encodeURIComponent(validationErrors.slice(0, 4).join(" | "))
      );
    }

    const { error } = await supabase.from("questions").insert(insertRows);

    if (error) {
      redirect(
        "/admin/questions/import?error=" +
          encodeURIComponent(error.message)
      );
    }

    revalidatePath("/admin");
    revalidatePath("/admin/questions");
    revalidatePath("/game/start");
    revalidatePath("/game/board");

    redirect(
      "/admin/questions/import?success=" +
        encodeURIComponent(`تم رفع ${insertRows.length} سؤال بنجاح.`)
    );
  }

  const templateHref = `data:application/json;charset=utf-8,${encodeURIComponent(
    sampleJson
  )}`;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="رفع أسئلة بالجملة"
        description="ارفع ملف JSON يحتوي على مجموعة أسئلة كاملة دفعة واحدة، مع دعم القسم والفئة والنقاط والسماحية والصور والفيديو."
        action={
          <>
            <a
              href={templateHref}
              download="seenjeem-questions-template.json"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              تحميل ملف مثال
            </a>
            <Link
              href="/admin/questions"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-300"
            >
              الرجوع للأسئلة
            </Link>
          </>
        }
      />

      {params.error ? (
        <div className="rounded-[1.5rem] border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-100 sm:text-base">
          {params.error}
        </div>
      ) : null}

      {params.success ? (
        <div className="rounded-[1.5rem] border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-100 sm:text-base">
          {params.success}
        </div>
      ) : null}

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 sm:p-6 lg:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <form action={importQuestions} className="rounded-[1.75rem] border border-white/10 bg-slate-900/50 p-4 sm:p-5">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-orange-400/20 bg-orange-400/10 px-3 py-1.5 text-xs text-orange-100 sm:text-sm">
                JSON Upload
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 sm:text-sm">
                الحد الأقصى 500 سؤال
              </span>
            </div>

            <h3 className="mt-4 text-2xl font-black text-white sm:text-3xl">
              ارفع ملف الأسئلة
            </h3>

            <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base">
              الملف يجب أن يكون بصيغة JSON ويحتوي على قائمة أسئلة. يمكنك تحديد
              القسم والفئة بالاسم أو بالـ slug.
            </p>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-semibold text-white">
                ملف الداتا
              </label>
              <input
                type="file"
                name="data_file"
                accept=".json,application/json"
                className="block w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-4 text-sm text-white file:ml-4 file:rounded-xl file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:text-sm file:font-bold file:text-slate-950"
              />
            </div>

            <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-bold text-white">الحقول المدعومة</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  "section / section_slug",
                  "category / category_slug",
                  "question_text",
                  "answer_text",
                  "points",
                  "is_active",
                  "year_tolerance_before",
                  "year_tolerance_after",
                  "question_image_url",
                  "question_video_url",
                  "answer_image_url",
                  "answer_video_url",
                ].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/10 bg-slate-950 px-3 py-1.5 text-xs text-slate-300"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-cyan-400 px-5 py-3 text-base font-black text-slate-950 transition hover:bg-cyan-300"
            >
              رفع وإضافة الأسئلة
            </button>
          </form>

          <div className="space-y-4">
            <div className="rounded-[1.75rem] border border-white/10 bg-slate-900/50 p-4 sm:p-5">
              <p className="text-sm font-bold text-white">ملاحظات مهمة</p>
              <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-300">
                <li>يجب أن تكون الفئة موجودة مسبقًا داخل لوحة الإدارة.</li>
                <li>يمكنك كتابة القسم والفئة بالاسم أو بالـ slug.</li>
                <li>الصور والفيديو تُضاف تلقائيًا داخل السؤال أو الجواب.</li>
                <li>إذا وُجد خطأ في سطر واحد فلن يتم رفع أي سؤال حتى تصحيح الملف.</li>
              </ul>
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-slate-900/50 p-4 sm:p-5">
              <p className="text-sm font-bold text-white">الفئات المتاحة حاليًا</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <span
                      key={category.id}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300"
                    >
                      {category.name} — {getSectionName(category.category_sections)}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-400">لا توجد فئات حالية.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 sm:p-6 lg:p-8">
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-cyan-300">مثال جاهز</p>
          <h3 className="mt-2 text-2xl font-black text-white sm:text-3xl">
            صيغة الملف المطلوبة
          </h3>
          <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base">
            يمكنك تحميل المثال الجاهز أو نسخ هذا الشكل واستخدامه كأساس لملفك.
          </p>
        </div>

        <pre className="mt-6 overflow-x-auto rounded-[1.5rem] border border-white/10 bg-slate-900/70 p-4 text-left text-xs leading-7 text-slate-200 sm:text-sm">
{sampleJson}
        </pre>
      </section>
    </div>
  );
}