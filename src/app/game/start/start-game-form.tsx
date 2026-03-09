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
    <div className="space-y-8">
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <label className="mb-3 block text-lg font-bold">اسم اللعبة</label>
          <input
            value={gameName}
            onChange={(e) => setGameName(e.target.value)}
            placeholder="مثال: تحدي المعلومات"
            className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-4 text-white outline-none"
          />
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <label className="mb-3 block text-lg font-bold">الفريق الأول</label>
          <input
            value={teamOne}
            onChange={(e) => setTeamOne(e.target.value)}
            placeholder="اسم الفريق الأول"
            className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-4 text-white outline-none"
          />
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <label className="mb-3 block text-lg font-bold">الفريق الثاني</label>
          <input
            value={teamTwo}
            onChange={(e) => setTeamTwo(e.target.value)}
            placeholder="اسم الفريق الثاني"
            className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-4 text-white outline-none"
          />
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black">اختر الفئات</h2>
            <p className="mt-2 text-slate-300">
              الفئات مرتبة تحت أقسام رئيسية لتسهيل الاختيار.
            </p>
          </div>

          <div className="rounded-full bg-cyan-400/15 px-4 py-2 text-sm font-bold text-cyan-300">
            تم اختيار {selectedCategories.length} فئات
          </div>
        </div>

        <div className="space-y-8">
          {groupedSections.length > 0 ? (
            groupedSections.map((section) => {
              const sectionGradient =
                sectionColors[section.slug] ??
                "from-slate-300/20 via-slate-400/10 to-transparent";

              return (
                <section
                  key={section.id}
                  className="rounded-[2rem] border border-white/10 bg-slate-900/40 p-5"
                >
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="text-3xl font-black">{section.name}</div>
                      <div className="mt-2 text-slate-300">
                        {section.description || "قسم رئيسي للفئات"}
                      </div>
                    </div>

                    <div
                      className={`rounded-full border border-white/10 bg-gradient-to-r ${sectionGradient} px-5 py-2 text-sm font-bold text-white`}
                    >
                      {section.slug}
                    </div>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                    {section.categories.map((category) => {
                      const active = selectedCategories.includes(category.slug);

                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => toggleCategory(category.slug)}
                          className={`overflow-hidden rounded-[2rem] border text-right transition ${
                            active
                              ? "border-cyan-400 bg-cyan-400/10"
                              : "border-white/10 bg-slate-950/60 hover:border-white/20"
                          }`}
                        >
                          <div
                            className={`relative h-44 bg-gradient-to-br ${
                              active
                                ? "from-cyan-400/20 via-sky-400/10 to-transparent"
                                : "from-white/10 via-white/5 to-transparent"
                            }`}
                          >
                            <div className="absolute left-4 top-4">
                              <div
                                className={`h-6 w-6 rounded-full border ${
                                  active
                                    ? "border-cyan-400 bg-cyan-400"
                                    : "border-white/20"
                                }`}
                              />
                            </div>

                            <div className="relative flex h-full items-center justify-center px-6">
                              {category.image_url ? (
                                <div className="relative h-28 w-28">
                                  <Image
                                    src={category.image_url}
                                    alt={category.name}
                                    fill
                                    className="object-contain"
                                  />
                                </div>
                              ) : (
                                <div className="text-6xl opacity-80">✨</div>
                              )}
                            </div>
                          </div>

                          <div className="border-t border-white/10 px-5 py-5">
                            <div className="text-2xl font-black">
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
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 text-slate-300">
              لا توجد أقسام أو فئات جاهزة حاليًا.
            </div>
          )}
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-red-200">
          {errorMessage}
        </div>
      ) : null}

      <div className="flex justify-center">
        <button
          type="button"
          onClick={handleStartGame}
          disabled={loading}
          className="rounded-[2rem] bg-cyan-400 px-10 py-5 text-2xl font-black text-slate-950 disabled:opacity-60"
        >
          {loading ? "جارٍ إنشاء اللعبة..." : "ابدأ اللعبة"}
        </button>
      </div>
    </div>
  );
}