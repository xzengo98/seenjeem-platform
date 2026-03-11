import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import AdminEmptyState from "@/components/admin/admin-empty-state";
import AdminPageHeader from "@/components/admin/admin-page-header";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type UserRow = {
  id: string;
  email: string | null;
  username: string | null;
  phone: string | null;
  role: string | null;
  account_tier: string | null;
  games_remaining: number | null;
  games_played: number | null;
  created_at: string | null;
};

type PageProps = {
  searchParams: Promise<{
    saved?: string;
    error?: string;
  }>;
};

function formatDate(value: string | null) {
  if (!value) return "-";

  try {
    return new Intl.DateTimeFormat("ar", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

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
  const roleRaw = String(formData.get("role") ?? "user");
  const tierRaw = String(formData.get("account_tier") ?? "free");
  const gamesRemainingRaw = Number(formData.get("games_remaining") ?? 0);

  const role = roleRaw === "admin" ? "admin" : "user";
  const accountTier = tierRaw === "premium" ? "premium" : "free";
  const gamesRemaining = Number.isFinite(gamesRemainingRaw)
    ? Math.max(0, Math.floor(gamesRemainingRaw))
    : 0;

  if (!userId) {
    redirect("/admin/users?error=invalid");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      role,
      account_tier: accountTier,
      games_remaining: gamesRemaining,
    })
    .eq("id", userId);

  if (error) {
    redirect("/admin/users?error=save");
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  revalidatePath("/account");
  revalidatePath("/game/start");
  revalidatePath("/");

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
      "id, email, username, phone, role, account_tier, games_remaining, games_played, created_at"
    )
    .order("created_at", { ascending: false });

  const users: UserRow[] = Array.isArray(data) ? (data as UserRow[]) : [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="إدارة الأعضاء"
        description="من هنا يمكنك تعديل الدور الإداري، نوع الحساب free أو premium، وعدد الألعاب المتبقية لكل مستخدم."
      />

      {params.saved ? (
        <div className="rounded-[1.5rem] border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-100 sm:text-base">
          تم حفظ التعديلات بنجاح.
        </div>
      ) : null}

      {params.error ? (
        <div className="rounded-[1.5rem] border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-100 sm:text-base">
          حدث خطأ أثناء الحفظ.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[1.5rem] border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-100 sm:text-base">
          فشل تحميل المستخدمين: {error.message}
        </div>
      ) : users.length > 0 ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {users.map((item) => (
            <form
              key={item.id}
              action={updateUserAction}
              className="rounded-[1.75rem] border border-white/10 bg-slate-900/50 p-4 sm:p-5"
            >
              <input type="hidden" name="user_id" value={item.id} />

              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-cyan-300 sm:text-sm">المستخدم</p>
                    <h3 className="mt-1 break-words text-2xl font-black text-white sm:text-3xl">
                      {item.username || "بدون اسم مستخدم"}
                    </h3>
                    <p className="mt-2 break-all text-xs text-slate-500">
                      {item.id}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white">
                      {item.role === "admin" ? "admin" : "user"}
                    </span>
                    <span
                      className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
                        item.account_tier === "premium"
                          ? "border-orange-400/20 bg-orange-400/10 text-orange-100"
                          : "border-cyan-400/20 bg-cyan-400/10 text-cyan-200"
                      }`}
                    >
                      {item.account_tier === "premium" ? "premium" : "free"}
                    </span>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <MiniInfoCard label="البريد الإلكتروني" value={item.email || "-"} />
                  <MiniInfoCard label="رقم الهاتف" value={item.phone || "-"} />
                  <MiniInfoCard
                    label="الألعاب المتبقية"
                    value={String(item.games_remaining ?? 0)}
                  />
                  <MiniInfoCard
                    label="الألعاب التي لُعبت"
                    value={String(item.games_played ?? 0)}
                  />
                </div>

                <div className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs text-slate-400 sm:text-sm">تاريخ الإنشاء</p>
                  <p className="mt-2 text-sm font-bold text-white sm:text-base">
                    {formatDate(item.created_at)}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-white">
                      الدور
                    </label>
                    <select
                      name="role"
                      defaultValue={item.role ?? "user"}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400/50"
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-white">
                      نوع الحساب
                    </label>
                    <select
                      name="account_tier"
                      defaultValue={item.account_tier ?? "free"}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400/50"
                    >
                      <option value="free">free</option>
                      <option value="premium">premium</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-white">
                      الألعاب المتبقية
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      name="games_remaining"
                      defaultValue={item.games_remaining ?? 0}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400/50"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-cyan-400 px-5 py-3 text-base font-black text-slate-950 transition hover:bg-cyan-300"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          ))}
        </div>
      ) : (
        <AdminEmptyState
          title="لا يوجد مستخدمون حاليًا"
          description="عند إنشاء حسابات جديدة ستظهر هنا لتتمكن من إدارتها."
        />
      )}
    </div>
  );
}

function MiniInfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-xs text-slate-400 sm:text-sm">{label}</p>
      <p className="mt-2 break-words text-sm font-bold text-white sm:text-base">
        {value}
      </p>
    </div>
  );
}