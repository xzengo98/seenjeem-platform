import type { ReactNode } from "react";
import Link from "next/link";

type AdminLayoutProps = {
  children: ReactNode;
};

const sidebarItems = [
  { label: "الرئيسية", href: "/admin" },
  { label: "الأقسام الرئيسية", href: "/admin/sections" },
  { label: "الفئات", href: "/admin/categories" },
  { label: "الأسئلة", href: "/admin/questions" },
  { label: "إضافة قسم جديد", href: "/admin/sections/new" },
  { label: "إضافة فئة جديدة", href: "/admin/categories/new" },
  { label: "إضافة سؤال جديد", href: "/admin/questions/new" },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="grid min-h-screen xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="border-l border-white/10 bg-slate-900/60 p-6 xl:min-h-screen">
          <div className="xl:sticky xl:top-6">
            <div className="mb-8">
              <Link href="/" className="text-3xl font-black text-cyan-400">
                SeenJeem Admin
              </Link>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                لوحة الإدارة الخاصة بالأقسام والفئات والأسئلة.
              </p>
            </div>

            <div className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">
              التنقل السريع
            </div>

            <nav className="space-y-2">
              {sidebarItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-2xl px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        <section className="p-6 md:p-10">
          <div className="mb-8 flex items-center justify-between rounded-[2rem] border border-white/10 bg-white/5 px-6 py-4">
            <div>
              <h1 className="text-2xl font-black">لوحة التحكم</h1>
              <p className="mt-1 text-sm text-slate-400">
                إدارة شاملة للمحتوى الأساسي للعبة
              </p>
            </div>

            <Link
              href="/"
              className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              الرجوع للموقع
            </Link>
          </div>

          {children}
        </section>
      </div>
    </main>
  );
}