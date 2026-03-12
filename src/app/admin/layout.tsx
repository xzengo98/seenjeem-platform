import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type AdminLayoutProps = {
  children: ReactNode;
};

const sidebarItems = [
  { label: "الرئيسية", href: "/admin" },
  { label: "الأقسام الرئيسية", href: "/admin/sections" },
  { label: "الفئات", href: "/admin/categories" },
  { label: "الأسئلة", href: "/admin/questions" },
  { label: "رفع أسئلة دفعة واحدة", href: "/admin/questions/import" },
  { label: "إضافة قسم جديد", href: "/admin/sections/new" },
  { label: "إضافة فئة جديدة", href: "/admin/categories/new" },
  { label: "إضافة سؤال جديد", href: "/admin/questions/new" },
  { label: "الأعضاء", href: "/admin/users" },
  { label: "الألعاب المنتهية", href: "/admin/games" },
];

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, username")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/");
  }

  return (
    <main dir="rtl" className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-10 pt-6 sm:px-6 lg:gap-8 lg:px-8 lg:pb-16 lg:pt-10">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 px-5 py-6 shadow-2xl shadow-slate-950/40 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.16),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.14),transparent_30%)]" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
                <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-cyan-200">
                  لوحة الإدارة
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-slate-300">
                  إدارة الأقسام والفئات والأسئلة
                </span>
              </div>

              <h1 className="mt-4 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
                أهلاً بك في لوحة التحكم
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base sm:leading-8">
                من هنا يمكنك إدارة الموقع بالكامل 
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:w-auto">
              <Link
                href="/admin/questions/import"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-orange-400/20 bg-orange-400/10 px-4 py-3 text-center text-sm font-bold text-orange-100 transition hover:bg-orange-400/15"
              >
                رفع أسئلة دفعة واحدة
              </Link>
              <Link
                href="/admin/questions/new"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-cyan-400 px-4 py-3 text-center text-sm font-black text-slate-950 transition hover:bg-cyan-300"
              >
                إضافة سؤال جديد
              </Link>
              <Link
                href="/"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-white/10"
              >
                الرجوع للموقع
              </Link>
              <div className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-bold text-slate-300">
                {profile?.username || "admin"}
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 sm:p-5">
            <div className="mb-4">
              <p className="text-sm font-medium text-cyan-300">التنقل السريع</p>
              <h2 className="mt-2 text-2xl font-black text-white">الإدارة</h2>
              <p className="mt-2 text-sm leading-7 text-slate-400">
                اختر القسم الذي تريد العمل عليه.
              </p>
            </div>

            <nav className="space-y-2">
              {sidebarItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm font-semibold text-white transition hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-cyan-200"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-slate-900/50 p-4">
              <p className="text-sm font-bold text-white">نصيحة سريعة</p>
              <p className="mt-2 text-sm leading-7 text-slate-400">
                لرفع كمية كبيرة من الأسئلة، استخدم صفحة الاستيراد الجماعي بدل
                الإضافة اليدوية سؤالًا سؤالًا.
              </p>
            </div>
          </aside>

          <section className="min-w-0">{children}</section>
        </div>
      </div>
    </main>
  );
}