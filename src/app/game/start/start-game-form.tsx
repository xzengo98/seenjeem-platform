"use client";

import {
  useMemo,
  useState,
  type FormEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  section_id: string | null;
  sort_order?: number | null;
};

type CategorySection = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
};

type CategoryAvailability = {
  availableGames: number;
  isSelectable: boolean;
  mode: "fixed" | "dynamic";
  easyCount: number;
  mediumCount: number;
  hardCount: number;
};

type Props = {
  sections?: CategorySection[];
  categories?: Category[];
  gamesRemaining: number;
  action: (formData: FormData) => void | Promise<void>;
  categoryAvailability: Record<string, CategoryAvailability>;
  selectionMode: "fixed" | "dynamic";
};

const REQUIRED_CATEGORY_COUNT = 6;

const sectionStyles: Record<
  string,
  {
    badge: string;
    ring: string;
    glow: string;
    chip: string;
  }
> = {
  general: {
    badge: "bg-orange-500/15 text-orange-200 border-orange-400/30",
    ring: "group-hover:border-orange-300/40",
    glow: "from-orange-400/20 via-orange-300/10 to-transparent",
    chip: "bg-orange-500 text-white",
  },
  islamic: {
    badge: "bg-emerald-500/15 text-emerald-200 border-emerald-400/30",
    ring: "group-hover:border-emerald-300/40",
    glow: "from-emerald-400/20 via-lime-300/10 to-transparent",
    chip: "bg-emerald-500 text-white",
  },
  entertainment: {
    badge: "bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-400/30",
    ring: "group-hover:border-fuchsia-300/40",
    glow: "from-fuchsia-400/20 via-pink-300/10 to-transparent",
    chip: "bg-fuchsia-500 text-white",
  },
  sports: {
    badge: "bg-cyan-500/15 text-cyan-200 border-cyan-400/30",
    ring: "group-hover:border-cyan-300/40",
    glow: "from-cyan-400/20 via-sky-300/10 to-transparent",
    chip: "bg-cyan-500 text-slate-950",
  },
};

function getSectionTheme(slug: string) {
  return (
    sectionStyles[slug] ?? {
      badge: "bg-white/10 text-white border-white/15",
      ring: "group-hover:border-white/25",
      glow: "from-slate-400/20 via-slate-300/10 to-transparent",
      chip: "bg-slate-200 text-slate-950",
    }
  );
}

export default function StartGameForm({
  sections = [],
  categories = [],
  gamesRemaining,
  action,
  categoryAvailability,
  selectionMode,
}: Props) {
  const [gameName, setGameName] = useState("");
  const [teamOne, setTeamOne] = useState("");
  const [teamTwo, setTeamTwo] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [openInfoId, setOpenInfoId] = useState<string | null>(null);

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

  const uncategorized = useMemo(() => {
    return safeCategories.filter((category) => !category.section_id);
  }, [safeCategories]);

  function toggleCategory(id: string) {
    const availability = categoryAvailability[id];

    if (!availability?.isSelectable) {
      setErrorMessage("هذه الفئة غير متاحة حاليًا لهذا الحساب.");
      return;
    }

    setSelectedCategories((prev) => {
      const isSelected = prev.includes(id);

      if (isSelected) {
        setErrorMessage("");
        return prev.filter((item) => item !== id);
      }

      if (prev.length >= REQUIRED_CATEGORY_COUNT) {
        setErrorMessage(`يمكنك اختيار ${REQUIRED_CATEGORY_COUNT} فئات فقط.`);
        return prev;
      }

      setErrorMessage("");
      return [...prev, id];
    });
  }

  function handleInfoClick(
    event: ReactMouseEvent<HTMLButtonElement>,
    categoryId: string
  ) {
    event.preventDefault();
    event.stopPropagation();
    setOpenInfoId((prev) => (prev === categoryId ? null : categoryId));
  }

  function validateBeforeSubmit(event: FormEvent<HTMLFormElement>) {
    const cleanGameName = gameName.trim();
    const cleanTeamOne = teamOne.trim();
    const cleanTeamTwo = teamTwo.trim();

    if (!cleanGameName || !cleanTeamOne || !cleanTeamTwo) {
      event.preventDefault();
      setErrorMessage("اسم اللعبة واسم الفريق الأول واسم الفريق الثاني مطلوبة.");
      return;
    }

    if (selectedCategories.length !== REQUIRED_CATEGORY_COUNT) {
      event.preventDefault();
      setErrorMessage(`يجب اختيار ${REQUIRED_CATEGORY_COUNT} فئات بالضبط.`);
      return;
    }

    const hasUnavailableSelection = selectedCategories.some(
      (id) => !categoryAvailability[id]?.isSelectable
    );

    if (hasUnavailableSelection) {
      event.preventDefault();
      setErrorMessage("هناك فئة مختارة لم تعد متاحة، حدّث الاختيار ثم حاول مجددًا.");
      return;
    }

    setErrorMessage("");
  }

  const isReadyToSubmit = selectedCategories.length === REQUIRED_CATEGORY_COUNT;

  return (
    <form action={action} onSubmit={validateBeforeSubmit} className="space-y-6">
      <input
        type="hidden"
        name="selectedCategories"
        value={selectedCategories.join(",")}
      />

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 sm:p-6 lg:p-8">
        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-200 sm:text-sm">
                الخطوة الأولى
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 sm:text-sm">
                اختر اسم اللعبة وأسماء الفرق
              </span>
            </div>

            <div className="mt-4 grid gap-4 min-[620px]:grid-cols-2">
              <div className="min-[620px]:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-white">
                  اسم اللعبة
                </label>
                <input
                  name="gameName"
                  value={gameName}
                  onChange={(e) => setGameName(e.target.value)}
                  placeholder="مثال: تحدي الأذكياء"
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-4 text-white outline-none transition focus:border-cyan-400/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-white">
                  الفريق الأول
                </label>
                <input
                  name="teamOne"
                  value={teamOne}
                  onChange={(e) => setTeamOne(e.target.value)}
                  placeholder="اسم الفريق الأول"
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-4 text-white outline-none transition focus:border-cyan-400/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-white">
                  الفريق الثاني
                </label>
                <input
                  name="teamTwo"
                  value={teamTwo}
                  onChange={(e) => setTeamTwo(e.target.value)}
                  placeholder="اسم الفريق الثاني"
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-4 text-white outline-none transition focus:border-cyan-400/50"
                />
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-cyan-400/10 via-slate-950 to-orange-400/10 p-4 sm:p-5">
            <h2 className="text-lg font-black text-white sm:text-xl">
              ملخص الإعداد
            </h2>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <InfoBox label="الألعاب المتبقية" value={String(gamesRemaining)} />
              <InfoBox
                label="الفئات المختارة"
                value={`${selectedCategories.length}/${REQUIRED_CATEGORY_COUNT}`}
              />
            </div>

            <div className="mt-4 rounded-[1.25rem] border border-white/10 bg-slate-950/60 p-4">
              <p className="text-sm leading-7 text-slate-300">
                {selectionMode === "dynamic" ? (
                  <>
                    حسابك يعمل الآن بنمط{" "}
                    <span className="font-bold text-white">
                      عشوائي بدون تكرار
                    </span>
                    . تحت كل فئة سيظهر عدد الألعاب المتبقية الممكنة.
                  </>
                ) : (
                  <>
                    حسابك يعمل الآن بنمط{" "}
                    <span className="font-bold text-white">الأسئلة الثابتة</span>.
                    ستظهر لك نفس المجموعة الثابتة في كل مرة طالما الفئة مكتملة.
                  </>
                )}
              </p>
            </div>

            <div className="mt-4 rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-white">حالة الاختيار</p>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    isReadyToSubmit
                      ? "bg-emerald-500/15 text-emerald-200"
                      : "bg-orange-500/15 text-orange-100"
                  }`}
                >
                  {isReadyToSubmit ? "جاهز للبدء" : "أكمل اختيار الفئات"}
                </span>
              </div>

              <p className="mt-3 text-sm leading-7 text-slate-300">
                {isReadyToSubmit
                  ? "تم اختيار العدد المطلوب. يمكنك الآن بدء اللعبة."
                  : `اختر ${
                      REQUIRED_CATEGORY_COUNT - selectedCategories.length
                    } فئات إضافية للمتابعة.`}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-orange-400/30 bg-orange-400/10 px-3 py-1.5 text-xs text-orange-100 sm:text-sm">
                الخطوة الثانية
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 sm:text-sm">
                اختر {REQUIRED_CATEGORY_COUNT} فئات
              </span>
            </div>

            <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
              اختر الفئات المناسبة
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-300 sm:text-base">
              كل فئة تعرض الصورة والاسم بشكل منظم، ومعها زر معلومات لقراءة وصف
              مختصر قبل إضافتها إلى اللعبة.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 px-4 py-3 text-center">
            <p className="text-xs text-slate-400 sm:text-sm">الفئات المختارة</p>
            <p className="mt-1 text-2xl font-black text-cyan-300">
              {selectedCategories.length}
              <span className="mr-1 text-base text-slate-400">/6</span>
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-8">
          {groupedSections.map((section) => {
            const theme = getSectionTheme(section.slug);

            return (
              <div key={section.id}>
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-3 py-1.5 text-xs font-bold sm:text-sm ${theme.badge}`}
                      >
                        {section.name}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 sm:text-sm">
                        {section.categories.length} فئات
                      </span>
                    </div>

                    <p className="mt-2 text-sm leading-7 text-slate-400">
                      {section.description || "قسم رئيسي للفئات"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 min-[560px]:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                  {section.categories.map((category) => {
                    const active = selectedCategories.includes(category.id);

                    return (
                      <CategoryCard
                        key={category.id}
                        category={category}
                        active={active}
                        infoOpen={openInfoId === category.id}
                        onToggle={() => toggleCategory(category.id)}
                        onInfoClick={handleInfoClick}
                        theme={theme}
                        availability={
                          categoryAvailability[category.id] ?? {
                            availableGames: 0,
                            isSelectable: false,
                            mode: selectionMode,
                            easyCount: 0,
                            mediumCount: 0,
                            hardCount: 0,
                          }
                        }
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}

          {uncategorized.length > 0 ? (
            <div>
              <div className="mb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white sm:text-sm">
                    فئات بدون قسم
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 sm:text-sm">
                    {uncategorized.length} فئات
                  </span>
                </div>
                <p className="mt-2 text-sm leading-7 text-slate-400">
                  هذه الفئات غير مربوطة بقسم رئيسي.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 min-[560px]:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                {uncategorized.map((category) => {
                  const active = selectedCategories.includes(category.id);

                  return (
                    <CategoryCard
                      key={category.id}
                      category={category}
                      active={active}
                      infoOpen={openInfoId === category.id}
                      onToggle={() => toggleCategory(category.id)}
                      onInfoClick={handleInfoClick}
                      theme={getSectionTheme("default")}
                      availability={
                        categoryAvailability[category.id] ?? {
                          availableGames: 0,
                          isSelectable: false,
                          mode: selectionMode,
                          easyCount: 0,
                          mediumCount: 0,
                          hardCount: 0,
                        }
                      }
                    />
                  );
                })}
              </div>
            </div>
          ) : null}

          {groupedSections.length === 0 && uncategorized.length === 0 ? (
            <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-6 text-center text-slate-300">
              لا توجد أقسام أو فئات جاهزة حاليًا.
            </div>
          ) : null}
        </div>
      </section>

      {errorMessage ? (
        <div className="rounded-[1.5rem] border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-100 sm:text-base">
          {errorMessage}
        </div>
      ) : null}

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-xl font-black text-white sm:text-2xl">
              جاهز لبدء اللعبة؟
            </h3>
            <p className="mt-2 text-sm leading-7 text-slate-300 sm:text-base">
              بعد التأكد من اسم اللعبة، أسماء الفرق، واختيار 6 فئات، يمكنك بدء
              الجولة مباشرة.
            </p>
          </div>

          <button
            type="submit"
            className={`inline-flex min-h-12 items-center justify-center rounded-2xl px-6 py-3 text-base font-bold transition ${
              isReadyToSubmit
                ? "bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                : "cursor-not-allowed bg-slate-700 text-slate-300"
            }`}
          >
            ابدأ اللعبة
          </button>
        </div>
      </section>
    </form>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-4 text-center">
      <p className="text-xs text-slate-400 sm:text-sm">{label}</p>
      <p className="mt-2 text-xl font-black text-white sm:text-2xl">{value}</p>
    </div>
  );
}

function CategoryCard({
  category,
  active,
  infoOpen,
  onToggle,
  onInfoClick,
  theme,
  availability,
}: {
  category: Category;
  active: boolean;
  infoOpen: boolean;
  onToggle: () => void;
  onInfoClick: (
    event: ReactMouseEvent<HTMLButtonElement>,
    categoryId: string
  ) => void;
  theme: {
    badge: string;
    ring: string;
    glow: string;
    chip: string;
  };
  availability: CategoryAvailability;
}) {
  const availabilityText = !availability.isSelectable
    ? "غير متاحة"
    : availability.mode === "dynamic"
    ? `باقي ${availability.availableGames} لعبة`
    : "أسئلة ثابتة";

  const availabilityClass = !availability.isSelectable
    ? "bg-red-500/15 text-red-200 border-red-500/20"
    : availability.mode === "dynamic"
    ? "bg-emerald-500/15 text-emerald-200 border-emerald-500/20"
    : "bg-white/10 text-white border-white/15";

  return (
    <div
      className={`group relative overflow-hidden rounded-[1.75rem] border transition ${
        active
          ? "border-cyan-400 bg-cyan-400/10 shadow-[0_0_0_1px_rgba(34,211,238,0.2)]"
          : availability.isSelectable
          ? `border-white/10 bg-slate-950/70 ${theme.ring}`
          : "border-white/10 bg-slate-950/50 opacity-70"
      }`}
    >
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${theme.glow}`}
      />

      <button
        type="button"
        onClick={(event) => onInfoClick(event, category.id)}
        className="absolute right-3 top-3 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full bg-sky-500 text-xl font-black text-white shadow-lg"
        aria-label={`عرض وصف ${category.name}`}
      >
        i
      </button>

      {active ? (
        <div className="absolute left-3 top-3 z-20 rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-white">
          تم الاختيار
        </div>
      ) : null}

      <button
        type="button"
        onClick={onToggle}
        disabled={!availability.isSelectable}
        className="relative block h-full w-full text-right disabled:cursor-not-allowed"
      >
        <div className="relative aspect-[1.02/1] overflow-hidden bg-slate-200/90">
          {category.image_url ? (
            <img
              src={category.image_url}
              alt={category.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-slate-800 text-4xl text-white/80">
              ✨
            </div>
          )}

          {infoOpen ? (
            <div className="absolute inset-x-3 top-14 z-20 rounded-2xl border border-white/10 bg-slate-950/95 p-3 shadow-2xl">
              <p className="text-xs font-bold text-white sm:text-sm">
                {category.name}
              </p>
              <p className="mt-2 text-[11px] leading-6 text-slate-200 sm:text-sm">
                {category.description || "لا يوجد وصف متاح لهذه الفئة حاليًا."}
              </p>
            </div>
          ) : null}
        </div>

        <div className={`relative space-y-2 px-3 py-3 text-center ${theme.chip}`}>
          <p className="text-base font-black sm:text-lg">{category.name}</p>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${availabilityClass}`}
            >
              {availabilityText}
            </span>
          </div>
        </div>
      </button>
    </div>
  );
}