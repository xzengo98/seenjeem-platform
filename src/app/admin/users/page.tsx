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
  created_at: string;
};

async function updateUserAction(formData: FormData) {
  "use server";

  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

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

  if (!userId) return;

  await supabase
    .from("profiles")
    .update({
      role,
      games_remaining: Number.isFinite(gamesRemaining) ? gamesRemaining : 0,
    })
    .eq("id", userId);

  revalidatePath("/admin/users");
}

export default async function AdminUsersPage() {
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
          من هنا تستطيع عرض المستخدمين وتعديل الصلاحيات وعدد الألعاب المتبقية.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-200">
          فشل تحميل المستخدمين: {error.message}
        </div>
      ) : (
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5">
          <div className="overflow-x-auto">
            <table className="min-w-full text-right text-white">
              <thead className="bg-slate-900/70 text-slate-200">
                <tr>
                  <th className="px-4 py-4">المستخدم</th>
                  <th className="px-4 py-4">البريد</th>
                  <th className="px-4 py-4">الهاتف</th>
                  <th className="px-4 py-4">الدور</th>
                  <th className="px-4 py-4">الألعاب المتبقية</th>
                  <th className="px-4 py-4">الألعاب التي لعبها</th>
                  <th className="px-4 py-4">تاريخ الإنشاء</th>
                  <th className="px-4 py-4">الإجراء</th>
                </tr>
              </thead>

              <tbody>
                {users.length > 0 ? (
                  users.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t border-white/10 align-top text-slate-300"
                    >
                      <td className="px-4 py-4">
                        <div className="font-bold text-white">
                          {item.username || "بدون اسم مستخدم"}
                        </div>
                        <div className="mt-1 text-xs text-slate-400">
                          {item.id}
                        </div>
                      </td>

                      <td className="px-4 py-4">{item.email || "-"}</td>
                      <td className="px-4 py-4">{item.phone || "-"}</td>

                      <td className="px-4 py-4">
                        <form action={updateUserAction} className="space-y-3">
                          <input type="hidden" name="user_id" value={item.id} />

                          <select
                            name="role"
                            defaultValue={item.role}
                            className="w-32 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none"
                          >
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                          </select>
                        </form>
                      </td>

                      <td className="px-4 py-4">
                        <form action={updateUserAction} className="space-y-3">
                          <input type="hidden" name="user_id" value={item.id} />
                          <input type="hidden" name="role" value={item.role} />

                          <input
                            type="number"
                            name="games_remaining"
                            defaultValue={item.games_remaining ?? 0}
                            min={0}
                            className="w-28 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none"
                          />
                        </form>
                      </td>

                      <td className="px-4 py-4">{item.games_played ?? 0}</td>

                      <td className="px-4 py-4">
                        {item.created_at
                          ? new Date(item.created_at).toLocaleDateString("ar-EG")
                          : "-"}
                      </td>

                      <td className="px-4 py-4">
                        <form action={updateUserAction}>
                          <input type="hidden" name="user_id" value={item.id} />
                          <input type="hidden" name="role" value={item.role} />
                          <input
                            type="hidden"
                            name="games_remaining"
                            value={item.games_remaining ?? 0}
                          />

                          <button
                            type="submit"
                            className="rounded-xl bg-cyan-400 px-4 py-2 font-bold text-slate-950"
                          >
                            حفظ
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                      لا يوجد مستخدمون حاليًا.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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