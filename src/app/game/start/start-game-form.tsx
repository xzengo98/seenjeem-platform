"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

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

type Props = {
  sections?: CategorySection[];
  categories?: Category[];
};

const sectionColors: Record<string, string> = {
  general: "from-orange-400/20 via-orange-300/10 to-transparent",
  islamic: "from-emerald-400/20 via-lime-300/10 to-transparent",
  entertainment: "from-fuchsia-400/20 via-pink-300/10 to-transparent",
  sports: "from-cyan-400/20 via-sky-300/10 to-transparent",
};

export default function StartGameForm({
  sections = [],
  categories = [],
}: Props) {
  const router = useRouter();

  const [gameName, setGameName] = useState("");
  const [teamOne, setTeamOne] = useState("");
  const [teamTwo, setTeamTwo] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const safeSections = Array.isArray(sections) ? sections : [];
  const safeCategories = Array.isArray(categories) ? categories : [];

  const groupedSections = useMemo(() => {
    return safeSections
      .map((section) => ({
        ...section,
        categories: safeCategories.filter(
          (category) => category.section_id === section.id
        ),
      }))
      .filter((section) => section.categories.length > 0);
  }, [safeSections, safeCategories]);

  function toggleCategory(slug: string) {
    setSelectedCategories((prev) =>
      prev.includes(slug)
        ? prev.filter((item) => item !== slug)
        : [...prev, slug]
    );
  }

  async function handleStartGame() {
    setErrorMessage("");

    const cleanGameName = gameName.trim();
    const cleanTeamOne = teamOne.trim();
    const cleanTeamTwo = teamTwo.trim();

    if (!cleanGameName || !cleanTeamOne || !cleanTeamTwo) {
      setErrorMessage("اسم اللعبة واسم الفريق الأول واسم الفريق الثاني مطلوبة.");
      return;
    }

    if (selectedCategories.length < 3) {
      setErrorMessage("اختر 3 فئات على الأقل.");
      return;
    }

    setLoading(true);

    const supabase = getSupabaseBrowserClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      setErrorMessage("يجب تسجيل الدخول أولًا.");
      router.push("/login");
      return;
    }

    const { data: sessionId, error } = await supabase.rpc("start_game_session", {
      p_user_id: user.id,
      p_game_name: cleanGameName,
      p_team_one_name: cleanTeamOne,
      p_team_two_name: cleanTeamTwo,
      p_selected_categories: selectedCategories,
      p_board_state: {},
    });

    setLoading(false);

    if (error || !sessionId) {
      setErrorMessage(
        error?.message === "NO_GAMES_REMAINING"
          ? "لا توجد ألعاب متبقية في رصيدك."
          : "فشل إنشاء جلسة اللعبة."
      );
      return;
    }

    const params = new URLSearchParams({
      sessionId: String(sessionId),
    });

    router.push(`/game/board?${params.toString()}`);
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="grid gap-4 xl:grid-cols-3 md:gap-6">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 md:rounded-[2rem] md:p-6">
          <label className="mb-3 block text-base font-bold md:text-lg">اسم اللعبة</label>
          <input
            value={gameName}
            onChange={(e) => setGameName(e.target.value)}
            placeholder="مثال: تحدي المعلومات"
            className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none md:py-4 md:text-base"
          />
        </div>

        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 md:rounded-[2rem] md:p-6">
          <label className="mb-3 block text-base font-bold md:text-lg">الفريق الأول</label>
          <input
            value={teamOne}
            onChange={(e) => setTeamOne(e.target.value)}
            placeholder="اسم الفريق الأول"
            className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none md:py-4 md:text-base"
          />
        </div>

        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 md:rounded-[2rem] md:p-6">
          <label className="mb-3 block text-base font-bold md:text-lg">الفريق الثاني</label>
          <input
            value={teamTwo}
            onChange={(e) => setTeamTwo(e.target.value)}
            placeholder="اسم الفريق الثاني"
            className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none md:py-4 md:text-base"
          />
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 md:rounded-[2rem] md:p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-black md:text-2xl">اختر الفئات</h2>
            <p className="mt-2 text-sm leading-7 text-slate-300 md:text-base">
              الفئات مرتبة تحت أقسام رئيسية لتسهيل الاختيار.
            </p>
          </div>

          <div className="rounded-full bg-cyan-400/15 px-4 py-2 text-sm font-bold text-cyan-300">
            تم اختيار {selectedCategories.length} فئات
          </div>
        </div>

        <div className="space-y-6 md:space-y-8">
          {groupedSections.length > 0 ? (
            groupedSections.map((section) => {
              const sectionGradient =
                sectionColors[section.slug] ??
                "from-slate-300/20 via-slate-400/10 to-transparent";

              return (
                <section
                  key={section.id}
                  className="rounded-[1.5rem] border border-white/10 bg-slate-900/40 p-4 md:rounded-[2rem] md:p-5"
                >
                  <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                    <div>
                      <div className="text-2xl font-black md:text-3xl">{section.name}</div>
                      <div className="mt-2 text-sm leading-7 text-slate-300 md:text-base">
                        {section.description || "قسم رئيسي للفئات"}
                      </div>
                    </div>

                    <div
                      className={`rounded-full border border-white/10 bg-gradient-to-r ${sectionGradient} px-4 py-2 text-sm font-bold text-white`}
                    >
                      {section.slug}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-5">
                    {section.categories.map((category) => {
                      const active = selectedCategories.includes(category.slug);

                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => toggleCategory(category.slug)}
                          className={`overflow-hidden rounded-[1.5rem] border text-right transition md:rounded-[2rem] ${
                            active
                              ? "border-cyan-400 bg-cyan-400/10"
                              : "border-white/10 bg-slate-950/60 hover:border-white/20"
                          }`}
                        >
                          <div
                            className={`relative h-36 bg-gradient-to-br md:h-44 ${
                              active
                                ? "from-cyan-400/20 via-sky-400/10 to-transparent"
                                : "from-white/10 via-white/5 to-transparent"
                            }`}
                          >
                            <div className="absolute left-3 top-3 md:left-4 md:top-4">
                              <div
                                className={`h-5 w-5 rounded-full border md:h-6 md:w-6 ${
                                  active
                                    ? "border-cyan-400 bg-cyan-400"
                                    : "border-white/20"
                                }`}
                              />
                            </div>

                            <div className="relative flex h-full items-center justify-center px-4 md:px-6">
                              {category.image_url ? (
                                <div className="relative h-24 w-24 md:h-28 md:w-28">
                                  <Image
                                    src={category.image_url}
                                    alt={category.name}
                                    fill
                                    className="object-contain"
                                  />
                                </div>
                              ) : (
                                <div className="text-5xl opacity-80 md:text-6xl">✨</div>
                              )}
                            </div>
                          </div>

                          <div className="border-t border-white/10 px-4 py-4 md:px-5 md:py-5">
                            <div className="text-xl font-black md:text-2xl">
                              {category.name}
                            </div>
                            <div className="mt-2 text-sm text-cyan-300">
                              {category.slug}
                            </div>
                            <p className="mt-3 min-h-[48px] text-sm leading-7 text-slate-300">
                              {category.description || "بدون وصف"}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })
          ) : (
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 text-sm text-slate-300 md:text-base">
              لا توجد أقسام أو فئات جاهزة حاليًا.
            </div>
          )}
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-200 md:text-base">
          {errorMessage}
        </div>
      ) : null}

      <div className="flex justify-center">
        <button
          type="button"
          onClick={handleStartGame}
          disabled={loading}
          className="w-full max-w-md rounded-[1.5rem] bg-cyan-400 px-8 py-4 text-lg font-black text-slate-950 disabled:opacity-60 md:rounded-[2rem] md:px-10 md:py-5 md:text-2xl"
        >
          {loading ? "جارٍ إنشاء اللعبة..." : "ابدأ اللعبة"}
        </button>
      </div>
    </div>
  );
}