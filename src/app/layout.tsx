import { ReactNode } from "react";

type AdminLayoutProps = {
  children: ReactNode;
};

const sidebarItems = [
  { label: "الرئيسية", href: "/admin" },
  { label: "الفئات", href: "/admin/categories" },
  { label: "الأسئلة", href: "/admin/questions" },
  { label: "المستخدمون", href: "/admin/users" },
  { label: "الأرصدة", href: "/admin/credits" },
  { label: "الباقات", href: "/admin/plans" },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="grid min-h-screen md:grid-cols-[280px_1fr]">
        <aside className="border-l border-white/10 bg-slate-900/60 p-6">
          <div className="mb-8">
            <a href="/" className="text-2xl font-black text-cyan-400">
              SeenJeem Admin
            </a>
            <p className="mt-2 text-sm text-slate-400">
              لوحة التحكم الرئيسية للمشروع
            </p>
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
        </aside>

        <section className="p-6 md:p-10">
          <div className="mb-8 flex items-center justify-between rounded-[2rem] border border-white/10 bg-white/5 px-6 py-4">
            <div>
              <h1 className="text-2xl font-black">لوحة التحكم</h1>
              <p className="mt-1 text-sm text-slate-400">
                إدارة شاملة للمحتوى والمستخدمين والباقات
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