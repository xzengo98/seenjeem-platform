import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

async function loginAction(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "").trim();

  if (!email || !password) {
    redirect("/login?error=يرجى إدخال البريد الإلكتروني وكلمة المرور");
  }

  const supabase = await getSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect("/login?error=بيانات الدخول غير صحيحة");
  }

  redirect("/game/start");
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-xl">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
          <h1 className="text-4xl font-black">تسجيل الدخول</h1>
          <p className="mt-3 text-slate-300">
            سجّل دخولك للوصول إلى حسابك وألعابك.
          </p>

          {params.error ? (
            <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-red-200">
              {params.error}
            </div>
          ) : null}

          {params.success ? (
            <div className="mt-6 rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-green-200">
              {params.success}
            </div>
          ) : null}

          <form action={loginAction} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-200">
                البريد الإلكتروني
              </label>
              <input
                name="email"
                type="email"
                placeholder="name@email.com"
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-200">
                كلمة المرور
              </label>
              <input
                name="password"
                type="password"
                placeholder="******"
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-cyan-400 px-6 py-3 font-black text-slate-950"
            >
              تسجيل الدخول
            </button>
          </form>

          <div className="mt-6 text-sm text-slate-300">
            ليس لديك حساب؟{" "}
            <Link href="/register" className="font-bold text-cyan-300">
              إنشاء حساب جديد
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}