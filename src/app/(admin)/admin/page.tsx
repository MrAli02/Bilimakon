import { createClient } from "@/lib/supabase/server";
import { Users, BookOpen, CreditCard, Key, Ban, FileText, ChevronRight, Check, Clock, X } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [
    { count: totalUsers },
    { count: totalCourses },
    { data: recentPayments },
    { count: activeKeys },
    { count: blockedUsers },
    { count: totalMaterials },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("courses").select("*", { count: "exact", head: true }),
    supabase.from("payments").select("*, profiles(full_name)").order("created_at", { ascending: false }).limit(5),
    supabase.from("access_keys").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_blocked", true),
    supabase.from("materials").select("*", { count: "exact", head: true }),
  ]);

  const { data: confirmedPayments } = await supabase.from("payments").select("amount").eq("status", "confirmed");
  const totalRevenue = confirmedPayments?.reduce((s: number, p: any) => s + Number(p.amount), 0) ?? 0;

  const stats = [
    { label: "Foydalanuvchilar", value: totalUsers ?? 0, icon: Users, color: "rgba(168,85,247,0.1)", ic: "#a855f7", href: "/admin/users" },
    { label: "Faol kalitlar", value: activeKeys ?? 0, icon: Key, color: "rgba(16,185,129,0.1)", ic: "#10b981", href: "/admin/keys" },
    { label: "Bloklangan", value: blockedUsers ?? 0, icon: Ban, color: "rgba(239,68,68,0.1)", ic: "#ef4444", href: "/admin/users" },
    { label: "Kurslar", value: totalCourses ?? 0, icon: BookOpen, color: "rgba(59,130,246,0.1)", ic: "#3b82f6", href: "/admin/courses" },
    { label: "Materiallar", value: totalMaterials ?? 0, icon: FileText, color: "rgba(245,158,11,0.1)", ic: "#f59e0b", href: "/admin/materials" },
    { label: "Daromad (UZS)", value: totalRevenue.toLocaleString(), icon: CreditCard, color: "rgba(16,185,129,0.1)", ic: "#10b981", href: "/admin/payments" },
  ];

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>Dashboard</h1>
        <p style={{ color: "var(--text-secondary)" }}>Platforma umumiy ko&apos;rinishi</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {stats.map(s => (
          <Link key={s.label} href={s.href}
            className="card p-5 hover:scale-[1.02] transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.color }}>
                <s.icon size={20} style={{ color: s.ic }} />
              </div>
              <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: "var(--text-tertiary)" }} />
            </div>
            <div className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>{s.value}</div>
            <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Payments */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>So&apos;nggi to&apos;lovlar</h2>
            <Link href="/admin/payments" className="text-sm font-medium flex items-center gap-1" style={{ color: "#a855f7" }}>
              Barchasi <ChevronRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {recentPayments && recentPayments.length > 0 ? recentPayments.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b last:border-0"
                style={{ borderColor: "var(--border)" }}>
                <div>
                  <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {p.profiles?.full_name ?? "—"}
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {new Date(p.created_at).toLocaleDateString("uz-UZ")}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                    {Number(p.amount).toLocaleString()} UZS
                  </span>
                  <span className={`badge ${p.status === "confirmed" ? "badge-green" : p.status === "pending" ? "badge-yellow" : "badge-red"}`}>
                    {p.status === "confirmed" ? <Check size={11} /> : p.status === "pending" ? <Clock size={11} /> : <X size={11} />}
                  </span>
                </div>
              </div>
            )) : (
              <p className="text-sm py-4 text-center" style={{ color: "var(--text-tertiary)" }}>To&apos;lovlar yo&apos;q</p>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="card p-5">
          <h2 className="font-bold text-lg mb-5" style={{ color: "var(--text-primary)" }}>Tezkor harakatlar</h2>
          <div className="space-y-1.5">
            {[
              { href: "/admin/keys", label: "Yangi kalit yaratish", desc: "Foydalanuvchiga kirish kaliti berish", dot: "#a855f7" },
              { href: "/admin/users", label: "Foydalanuvchilar", desc: "Bloklash, sessiyalar, kalit berish", dot: "#3b82f6" },
              { href: "/admin/courses", label: "Kurs → Modul → Dars", desc: "Kontent boshqaruvi", dot: "#10b981" },
              { href: "/admin/materials", label: "PDF material qo'shish", desc: "Elektron darsliklar", dot: "#f59e0b" },
              { href: "/admin/questions", label: "Test savol qo'shish", desc: "Savollar banki", dot: "#ec4899" },
              { href: "/admin/payments", label: "To'lovlarni tasdiqlash", desc: "Kutilayotgan to'lovlar", dot: "#ef4444" },
              { href: "/admin/settings", label: "Sozlamalar", desc: "Narxlar, simulyator, platforma", dot: "#6b7280" },
            ].map(l => (
              <Link key={l.href} href={l.href}
                className="flex items-center justify-between px-4 py-2.5 rounded-xl transition-all hover:bg-[var(--bg-secondary)] group">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: l.dot }} />
                  <div>
                    <div className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>{l.label}</div>
                    <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>{l.desc}</div>
                  </div>
                </div>
                <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: "var(--text-tertiary)" }} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
