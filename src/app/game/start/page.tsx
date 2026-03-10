import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import StartGameForm from "./start-game-form";

export const dynamic = "force-dynamic";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  section_id: string | null;
};

type CategorySection = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
};

type SearchParams = Promise<{
  error?: string;
}>;

export default async function GameStartPage({
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
    .select("games_remaining")
    .eq("id", user.id)
    .single();

  if (!profile || profile.games_remaining <= 0) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 md:py-12 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-3xl rounded-[1.75rem] border border-red-500/20 bg-red-500/10 p-6 text-center md:rounded-[2rem] md:p-8">
          <h1 className="text-3xl font-black md:text-4xl">لا توجد ألعاب متبقية</h1>
          <p className="mt-4 text-sm leading-7 text-red-200 md:text-lg">
            تم استهلاك عدد الألعاب المتاحة لحسابك.
          </p>

          <div className="mt-8">
            <Link
              href="/"
              className="inline-block rounded-2xl border border-white/10 px-6 py-3 font-semibold text-white"
            >
              الرجوع للرئيسية
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const [sectionsResult, categoriesResult] = await Promise.all([
    supabase
      .from("category_sections")
      .select("id, name, slug, description, sort_order, is_active")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("categories")
      .select("id, name, slug, description, image_url, section_id")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
  ]);

  const { data: sectionsData, error: sectionsError } = sectionsResult;
  const { data: categoriesData, error: categoriesError } = categoriesResult;

  if (sectionsError || categoriesError) {
    const message =
      sectionsError?.message ?? categoriesError?.message ?? "Unknown error";

    return (
      <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 md:py-12 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[1.75rem] border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-200 md:rounded-[2rem] md:p-6 md:text-base">
            فشل تحميل بيانات الإعداد: {message}
          </div>
        </div>
      </main>
    );
  }

  const sections: CategorySection[] = Array.isArray(sectionsData)
    ? (sectionsData as CategorySection[])
    : [];

  const categories: Category[] = Array.isArray(categoriesData)
    ? (categoriesData as Category[])
    : [];

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 md:py-12 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-[1.75rem] border border-white/10 bg-white/5 px-5 py-6 md:mb-8 md:rounded-[2rem] md:px-8 md:py-6">
          <h1 className="text-3xl font-black md:text-5xl">إعداد لعبة جديدة</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 md:text-lg md:leading-8">
            اختر الفئات، أدخل اسم اللعبة واسمَي الفريقين.
          </p>
          <div className="mt-4 text-sm text-cyan-300 md:text-base">
            الألعاب المتبقية: {profile.games_remaining}
          </div>
          {params.error ? (
            <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200 md:text-base">
              {params.error}
            </div>
          ) : null}
        </div>

        <StartGameForm sections={sections} categories={categories} />
      </div>
    </main>
  );
}