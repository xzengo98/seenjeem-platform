"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function NewCategoryPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    const cleanName = name.trim();
    const cleanSlug = slug.trim().toLowerCase();
    const cleanDescription = description.trim();
    const parsedSortOrder = Number(sortOrder);

    if (!cleanName || !cleanSlug) {
      setErrorMessage("اسم الفئة و slug مطلوبين.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("categories").insert({
      name: cleanName,
      slug: cleanSlug,
      description: cleanDescription || null,
      sort_order: Number.isNaN(parsedSortOrder) ? 0 : parsedSortOrder,
      is_active: isActive,
    });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    setSuccessMessage("تمت إضافة الفئة بنجاح.");
    setLoading(false);

    setTimeout(() => {
      router.push("/admin/categories");
      router.refresh();
    }, 800);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black">إضافة فئة جديدة</h2>
          <p className="mt-2 text-slate-300">
            أضف فئة جديدة لتظهر في لوحة التحكم وفي نظام اللعبة لاحقًا.
          </p>
        </div>

        <a
          href="/admin/categories"
          className="rounded-2xl border border-white/10 px-5 py-3 font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white"
        >
          الرجوع للفئات
        </a>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-[2rem] border border-white/10 bg-white/5 p-6"
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-200">
              اسم الفئة
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: تاريخ"
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-200">
              Slug
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="example: history"
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-bold text-slate-200">
              الوصف
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف مختصر للفئة"
              rows={4}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-200">
              الترتيب
            </label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-8">
            <input
              id="is_active"
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-5 w-5"
            />
            <label htmlFor="is_active" className="text-sm font-semibold text-slate-200">
              الفئة مفعلة
            </label>
          </div>
        </div>

        {errorMessage ? (
          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-red-200">
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-emerald-200">
            {successMessage}
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-4">
          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-cyan-400 px-6 py-3 font-bold text-slate-950 disabled:opacity-60"
          >
            {loading ? "جارٍ الحفظ..." : "حفظ الفئة"}
          </button>

          <a
            href="/admin/categories"
            className="rounded-2xl border border-white/10 px-6 py-3 font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white"
          >
            إلغاء
          </a>
        </div>
      </form>
    </div>
  );
}