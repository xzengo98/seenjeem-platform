import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type UserRow = {
  id: string;
  email: string | null;
  username: string | null;
  phone: string | null;
  role: string;
  games_remaining: number;
  games_played: number;
  created_at: string | null;
};

type PageProps = {
  searchParams: Promise<{
    saved?: string;
    error?: string;
  }>;
};

async function updateUserAction(formData: FormData) {
  "use server";

  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (currentProfile?.role !== "admin") {
    redirect("/");
  }

  const userId = String(formData.get("user_id") ?? "");
  const role = String(formData.get("role") ?? "user");
  const gamesRemaining = Number(formData.get("games_remaining") ?? 0);

  if (!userId) {
    redirect("/admin/users?error=invalid");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      role,
      games_remaining: Number.isFinite(gamesRemaining) ? gamesRemaining : 0,
    })
    .eq("id", userId);

  if (error) {
    redirect("/admin/users?error=save");
  }

  revalidatePath("/admin/users");
  revalidatePath("/");
  revalidatePath("/account");
  revalidatePath("/admin");

  redirect("/admin/users?saved=1");
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (currentProfile?.role !== "admin") {
    redirect("/");
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, email, username, phone, role, games_remaining, games_played, created_at"
    )
    .order("created_at", { ascending: false });

  const users: UserRow[] = Array.isArray(data) ? (data as UserRow[]) : [];

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-white/10 bg-white/5 px-8 py-6">
        <h1 className="text-4xl font-black text-white">إدارة المستخدمين</h1>
        <p className="mt-3 text-slate-300">
          من هنا تستطيع تعديل الصلاحيات وعدد الألعاب المتبقية لكل مستخدم.
        </p>
      </div>

      {params.saved ? (
        <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-4 text-green-200">
          تم حفظ التعديلات بنجاح.
        </div>
      ) : null}

      {params.error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-200">
          حدث خطأ أثناء الحفظ.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-200">
          فشل تحميل المستخدمين: {error.message}
        </div>
      ) : (
        <div className="space-y-4">
          {users.length > 0 ? (
            users.map((item) => (
              <form
                key={item.id}
                action={updateUserAction}
                className="rounded-[2rem] border border-white/10 bg-white/5 p-6"
              >
                <input type="hidden" name="user_id" value={item.id} />

                <div className="grid gap-6 lg:grid-cols-[1.4fr_1.4fr_1fr_1fr_1fr_auto]">
                  <div>
                    <div className="text-sm text-slate-400">المستخدم</div>
                    <div className="mt-2 text-lg font-bold text-white">
                      {item.username || "بدون اسم مستخدم"}
                    </div>
                    <div className="mt-2 break-all text-xs text-slate-500">
                      {item.id}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-slate-400">البريد / الهاتف</div>
                    <div className="mt-2 text-white">{item.email || "-"}</div>
                    <div className="mt-1 text-slate-300">{item.phone || "-"}</div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-slate-400">
                      الدور
                    </label>
                    <select
                      name="role"
                      defaultValue={item.role}
                      className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none"
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-slate-400">
                      الألعاب المتبقية
                    </label>
                    <input
                      type="number"
                      name="games_remaining"
                      defaultValue={item.games_remaining ?? 0}
                      min={0}
                      className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none"
                    />
                  </div>

                  <div>
                    <div className="text-sm text-slate-400">الألعاب التي لعبها</div>
                    <div className="mt-2 text-2xl font-black text-cyan-300">
                      {item.games_played ?? 0}
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      {item.created_at
                        ? new Date(item.created_at).toLocaleDateString("ar-EG")
                        : "-"}
                    </div>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950"
                    >
                      حفظ
                    </button>
                  </div>
                </div>
              </form>
            ))
          ) : (
            <div className="rounded-[2rem] border border-white/10 bg-white/5 px-4 py-10 text-center text-slate-400">
              لا يوجد مستخدمون حاليًا.
            </div>
          )}
        </div>
      )}

      <div>
        <Link
          href="/admin"
          className="rounded-2xl border border-white/10 px-5 py-3 font-semibold text-slate-300"
        >
          العودة للوحة التحكم
        </Link>
      </div>
    </div>
  );
}