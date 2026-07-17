import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Check, Clock, X, CreditCard, TrendingUp } from "lucide-react";

async function confirmPayment(formData: FormData) {
  "use server";
  const paymentId = formData.get("paymentId") as string;
  const userId = formData.get("userId") as string;
  const supabase = await createAdminClient();
  await supabase.from("payments").update({ status: "confirmed", confirmed_at: new Date().toISOString() }).eq("id", paymentId);
  await supabase.from("simulator_attempts").insert({ user_id: userId, payment_id: paymentId, status: "active" });
  revalidatePath("/admin/payments");
}

async function rejectPayment(formData: FormData) {
  "use server";
  const paymentId = formData.get("paymentId") as string;
  const supabase = await createAdminClient();
  await supabase.from("payments").update({ status: "failed" }).eq("id", paymentId);
  revalidatePath("/admin/payments");
}

export default async function AdminPaymentsPage() {
  const supabase = await createClient();
  const { data: payments } = await supabase
    .from("payments")
    .select("*, profiles(full_name, email, phone)")
    .order("created_at", { ascending: false });

  const pending = payments?.filter((p: any) => p.status === "pending") ?? [];
  const confirmed = payments?.filter((p: any) => p.status === "confirmed") ?? [];
  const totalRevenue = confirmed.reduce((s: number, p: any) => s + Number(p.amount), 0);

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>To&apos;lovlar</h1>
        <p style={{ color: "var(--text-secondary)" }}>Barcha to&apos;lovlar va tasdiqlash</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Kutilmoqda", value: pending.length, icon: Clock, color: "rgba(245,158,11,0.1)", ic: "#f59e0b" },
          { label: "Tasdiqlangan", value: confirmed.length, icon: Check, color: "rgba(16,185,129,0.1)", ic: "#10b981" },
          { label: "Jami daromad", value: `${totalRevenue.toLocaleString()} UZS`, icon: TrendingUp, color: "rgba(168,85,247,0.1)", ic: "#a855f7" },
        ].map(s => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.color }}>
              <s.icon size={19} style={{ color: s.ic }} />
            </div>
            <div>
              <div className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{s.value}</div>
              <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {pending.length > 0 && (
        <div className="card overflow-hidden mb-6">
          <div className="p-4 border-b flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 animate-pulse" />
            <span className="font-bold" style={{ color: "var(--text-primary)" }}>
              Kutilayotgan to&apos;lovlar ({pending.length}) — tasdiqlash kerak
            </span>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {pending.map((p: any) => (
              <div key={p.id} className="p-4 flex items-center gap-4 hover:bg-[var(--bg-secondary)] transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                    {p.profiles?.full_name ?? "—"}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                    {p.profiles?.email} · {p.profiles?.phone ?? "—"}
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {new Date(p.created_at).toLocaleString("uz-UZ")}
                  </div>
                </div>
                <div className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                  {Number(p.amount).toLocaleString()} UZS
                </div>
                <div className="flex gap-2">
                  <form action={confirmPayment}>
                    <input type="hidden" name="paymentId" value={p.id} />
                    <input type="hidden" name="userId" value={p.user_id} />
                    <button type="submit"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
                      style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}>
                      <Check size={14} /> Tasdiqlash
                    </button>
                  </form>
                  <form action={rejectPayment}>
                    <input type="hidden" name="paymentId" value={p.id} />
                    <button type="submit"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
                      style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                      <X size={14} /> Rad etish
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
          <span className="font-bold" style={{ color: "var(--text-primary)" }}>
            Barcha to&apos;lovlar ({payments?.length ?? 0})
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: "var(--bg-secondary)" }}>
                {["Foydalanuvchi","Miqdor","Holat","Sana"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments?.map((p: any) => (
                <tr key={p.id} className="border-t hover:bg-[var(--bg-secondary)] transition-colors" style={{ borderColor: "var(--border)" }}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>{p.profiles?.full_name}</div>
                    <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>{p.profiles?.email}</div>
                  </td>
                  <td className="px-4 py-3 font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                    {Number(p.amount).toLocaleString()} UZS
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${p.status === "confirmed" ? "badge-green" : p.status === "pending" ? "badge-yellow" : "badge-red"}`}>
                      {p.status === "confirmed" ? "✓ Tasdiqlandi" : p.status === "pending" ? "⏳ Kutilmoqda" : "✗ Rad"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {new Date(p.created_at).toLocaleDateString("uz-UZ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!payments || payments.length === 0) && (
            <div className="py-12 text-center">
              <CreditCard size={32} className="mx-auto mb-3" style={{ color: "var(--text-tertiary)" }} />
              <p style={{ color: "var(--text-secondary)" }}>To&apos;lovlar yo&apos;q</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
