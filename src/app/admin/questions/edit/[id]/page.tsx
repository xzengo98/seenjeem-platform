import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import HtmlSnippetEditor from "@/components/admin/html-snippet-editor";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  error?: string;
  success?: string;
  returnTo?: string;
}>;

type CategoryRelation = { name: string } | { name: string }[] | null;

type CategoryRow = {
  id: string;
  name: string;
  category_sections: CategoryRelation;
};

type QuestionRow = {
  id: string;
  question_text: string | null;
  answer_text: string | null;
  category_id: string | null;
  points: number | null;
  is_active: boolean | null;
  year_tolerance_before: number | null;
  year_tolerance_after: number | null;
};

function getSectionName(section: CategoryRelation) {
  if (!section) return "";
  if (Array.isArray(section)) return section[0]?.name ?? "";
  return section.name;
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

  if (baseHtml.trim()) {
    parts.push(baseHtml.trim());
  }

  if (imageUrl.trim()) {
    parts.push(`
<figure style="text-align:center;">
  <img src="${imageUrl.trim()}" alt="" style="max-width:100%;height:auto;" />
</figure>`);
  }

  if (videoUrl.trim()) {
    const embed = toYouTubeEmbed(videoUrl.trim());

    if (embed.includes("youtube.com/embed/")) {
      parts.push(`
<div class="video-wrap" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;">
  <iframe
    src="${embed}"
    title="video"
    style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;"
    allowfullscreen
  ></iframe>
</div>`);
    } else {
      parts.push(`
<video controls style="max-width:100%;height:auto;">
  <source src="${videoUrl.trim()}" />
</video>`);
    }
  }

  return parts.join("\n\n").trim();
}

function extractFirstMatch(value: string, regex: RegExp) {
  const match = value.match(regex);
  return match?.[1]?.trim() ?? "";
}

function stripMediaBlocks(value: string) {
  return value
    .replace(/<figure[\s\S]*?<img[\s\S]*?<\/figure>/gis, "")
    .replace(/<img[^>]*>/gis, "")
    .replace(
      /<div[^>]*class=["'][^"']*video-wrap[^"']*["'][^>]*>[\s\S]*?<\/div>/gis,
      "",
    )
    .replace(/<iframe[\s\S]*?<\/iframe>/gis, "")
    .replace(/<video[\s\S]*?<\/video>/gis, "")
    .replace(/<p>\s*<\/p>/gis, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitContentAndMedia(value: string | null) {
  const html = value ?? "";

  const imageUrl = extractFirstMatch(
    html,
    /<img[^>]+src=["']([^"']+)["'][^>]*>/i,
  );

  let videoUrl = extractFirstMatch(
    html,
    /<iframe[^>]+src=["']([^"']+)["'][^>]*>/i,
  );

  if (!videoUrl) {
    videoUrl = extractFirstMatch(
      html,
      /<source[^>]+src=["']([^"']+)["'][^>]*>/i,
    );
  }

  if (!videoUrl) {
    videoUrl = extractFirstMatch(
      html,
      /<video[^>]+src=["']([^"']+)["'][^>]*>/i,
    );
  }

  return {
    contentHtml: stripMediaBlocks(html),
    imageUrl,
    videoUrl,
  };
}

export default async function EditQuestionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
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

  const { data: questionData } = await supabase
    .from("questions")
    .select(`
      id,
      question_text,
      answer_text,
      category_id,
      points,
      is_active,
      year_tolerance_before,
      year_tolerance_after
    `)
    .eq("id", id)
    .single();

  if (!questionData) notFound();

  const question = questionData as QuestionRow;

  const { data: categoriesData } = await supabase
    .from("categories")
    .select("id, name, category_sections ( name )")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const categories = (categoriesData ?? []) as CategoryRow[];

  const parsedQuestion = splitContentAndMedia(question.question_text);
  const parsedAnswer = splitContentAndMedia(question.answer_text);

  async function updateQuestion(formData: FormData) {
    "use server";

    const supabase = await getSupabaseServerClient();

    const questionBase = formData.get("question_text")?.toString().trim() || "";
    const answerBase = formData.get("answer_text")?.toString().trim() || "";
    const category_id = formData.get("category_id")?.toString().trim() || "";
    const question_image_url =
      formData.get("question_image_url")?.toString().trim() || "";
    const question_video_url =
      formData.get("question_video_url")?.toString().trim() || "";
    const answer_image_url =
      formData.get("answer_image_url")?.toString().trim() || "";
    const answer_video_url =
      formData.get("answer_video_url")?.toString().trim() || "";
    const points = Number(formData.get("points") || 200);
    const is_active = formData.get("is_active") === "on";
    const year_tolerance_before = Number(
      formData.get("year_tolerance_before") || 0,
    );
    const year_tolerance_after = Number(
      formData.get("year_tolerance_after") || 0,
    );
    const returnToValue =
      formData.get("returnTo")?.toString().trim() || "/admin/questions";

    const finalQuestionText = appendMediaHtml(
      questionBase,
      question_image_url,
      question_video_url,
    );

    const finalAnswerText = appendMediaHtml(
      answerBase,
      answer_image_url,
      answer_video_url,
    );

    if (!finalQuestionText || !finalAnswerText || !category_id) {
      redirect(
        `/admin/questions/edit/${id}?error=${encodeURIComponent(
          "نص السؤال أو وسائطه، والإجابة أو وسائطها، والفئة حقول مطلوبة.",
        )}&returnTo=${encodeURIComponent(returnToValue)}`,
      );
    }

    const { error } = await supabase
      .from("questions")
      .update({
        question_text: finalQuestionText,
        answer_text: finalAnswerText,
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

    revalidatePath("/admin/questions");
    revalidatePath("/admin");
    revalidatePath("/game/start");
    revalidatePath("/game/board");

    redirect(returnToValue);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="rounded-[2rem] border border-white/10 bg-[#071126] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-cyan-300">إدارة المحتوى</div>
            <h1 className="mt-2 text-4xl font-black text-white">تعديل السؤال</h1>
            <p className="mt-3 text-lg leading-8 text-white/75">
              عدّل نص السؤال والإجابة والوسائط، ثم ارجع لنفس النتائج المفلترة بدون
              أن تضيع الفلترة.
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

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <label className="mb-2 block text-sm font-bold text-white">
                رابط صورة السؤال
              </label>
              <input
                type="url"
                name="question_image_url"
                defaultValue={parsedQuestion.imageUrl}
                placeholder="https://example.com/question-image.jpg"
                className="h-14 w-full rounded-2xl border border-white/10 bg-[#030b22] px-4 text-white outline-none placeholder:text-white/35"
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <label className="mb-2 block text-sm font-bold text-white">
                رابط فيديو السؤال
              </label>
              <input
                type="url"
                name="question_video_url"
                defaultValue={parsedQuestion.videoUrl}
                placeholder="https://youtube.com/watch?v=..."
                className="h-14 w-full rounded-2xl border border-white/10 bg-[#030b22] px-4 text-white outline-none placeholder:text-white/35"
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <label className="mb-2 block text-sm font-bold text-white">
                رابط صورة الإجابة
              </label>
              <input
                type="url"
                name="answer_image_url"
                defaultValue={parsedAnswer.imageUrl}
                placeholder="https://example.com/answer-image.jpg"
                className="h-14 w-full rounded-2xl border border-white/10 bg-[#030b22] px-4 text-white outline-none placeholder:text-white/35"
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <label className="mb-2 block text-sm font-bold text-white">
                رابط فيديو الإجابة
              </label>
              <input
                type="url"
                name="answer_video_url"
                defaultValue={parsedAnswer.videoUrl}
                placeholder="https://youtube.com/watch?v=..."
                className="h-14 w-full rounded-2xl border border-white/10 bg-[#030b22] px-4 text-white outline-none placeholder:text-white/35"
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <HtmlSnippetEditor
                label="نص السؤال"
                name="question_text"
                defaultValue={parsedQuestion.contentHtml}
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <HtmlSnippetEditor
                label="نص الإجابة"
                name="answer_text"
                defaultValue={parsedAnswer.contentHtml}
              />
            </div>
          </div>

          <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
            <h2 className="text-2xl font-black text-white">إعدادات السؤال</h2>
            <p className="mt-2 text-white/70">
              يمكنك تغيير الفئة، النقاط، حالة التفعيل، وسماحية السنوات من هنا.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-white">
                  الفئة
                </label>
                <select
                  name="category_id"
                  defaultValue={question.category_id ?? ""}
                  className="h-14 w-full rounded-2xl border border-white/10 bg-[#030b22] px-4 text-white outline-none"
                >
                  {categories.map((category) => {
                    const sectionName = getSectionName(category.category_sections);
                    return (
                      <option key={category.id} value={category.id}>
                        {sectionName
                          ? `${sectionName} / ${category.name}`
                          : category.name}
                      </option>
                    );
                  })}
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

              <div>
                <label className="mb-2 block text-sm font-bold text-white">
                  سماحية سنة قبل
                </label>
                <select
                  name="year_tolerance_before"
                  defaultValue={String(question.year_tolerance_before ?? 0)}
                  className="h-14 w-full rounded-2xl border border-white/10 bg-[#030b22] px-4 text-white outline-none"
                >
                  <option value="0">بدون سماحية</option>
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
                  <option value="0">بدون سماحية</option>
                  <option value="1">سنة واحدة بعد</option>
                  <option value="2">سنتان بعد</option>
                  <option value="5">5 سنوات بعد</option>
                  <option value="10">10 سنوات بعد</option>
                </select>
              </div>
            </div>

            <label className="mt-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#030b22] px-4 py-4 text-white">
              <input
                type="checkbox"
                name="is_active"
                defaultChecked={Boolean(question.is_active)}
                className="h-5 w-5 rounded border-white/20 bg-[#030b22]"
              />
              السؤال مفعّل
            </label>

            <p className="mt-4 text-sm leading-7 text-white/60">
              إذا أردت حذف الصورة أو الفيديو، امسح الرابط ثم احفظ التعديلات.
            </p>
          </section>

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
      </section>
    </div>
  );
}