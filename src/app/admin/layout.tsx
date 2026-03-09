import { ReactNode } from "react";

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
      <div className="grid min-h-screen md:grid-cols-[300px_1fr]">
        <aside className="border-l border-white/10 bg-slate-900/60 p-6">
          <div className="mb-8">
            <a href="/" className="text-3xl font-black text-cyan-400">
              SeenJeem Admin
            </a>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              لوحة إدارة المشروع الخاصة بالأقسام والفئات والأسئلة وإعداد بنية
              اللعبة.
            </p>
          </div>

          <div className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">
            التنقل السريع
          </div>

          <nav className="space-y-2">
            {sidebarItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="block rounded-2xl px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/5 p-4">
            <div className="text-sm text-slate-400">المرحلة الحالية</div>
            <div className="mt-2 text-lg font-bold text-cyan-300">
              تجهيز لوحة الإدارة
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              يتم الآن تنظيم الأقسام الرئيسية والفئات والأسئلة قبل ربط حفظ
              الجلسات والنقاط بشكل كامل.
            </p>
          </div>
        </aside>

        <section className="p-6 md:p-10">
          <div className="mb-8 flex items-center justify-between rounded-[2rem] border border-white/10 bg-white/5 px-6 py-4">
            <div>
              <h1 className="text-2xl font-black">لوحة التحكم</h1>
              <p className="mt-1 text-sm text-slate-400">
                إدارة شاملة لهيكلة اللعبة والمحتوى الجاهز للإطلاق
              </p>
            </div>

            <a
              href="/"
              className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              الرجوع للموقع
            </a>
          </div>

          {children}
        </section>
      </div>
    </main>
  );
}