import { createClient } from "@/lib/supabase/server";
import { Users, BookOpen, CreditCard, TrendingUp, Award } from "lucide-react";

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();

  const [
    { count: totalUsers },
    { count: totalTeachers },
    { count: totalCourses },
    { count: totalEnrollments },
    { count: lessonsDone },
    { count: simulators },
    { data: payments },
    { data: recentUsers },
    { count: blockedUsers },
    { count: activeKeys },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "teacher"),
    supabase.from("courses").select("*", { count: "exact", head: true }).eq("is_published", true),
    supabase.from("enrollments").select("*", { count: "exact", head: true }),
    supabase.from("lesson_progress").select("*", { count: "exact", head: true }).eq("is_completed", true),
    supabase.from("simulator_attempts").select("*", { count: "exact", head: true }),
    supabase.from("payments").select("amount, status, created_at").eq("status", "confirmed"),
    supabase.from("profiles").select("full_name, email, role, created_at, is_blocked")
      .order("created_at", { ascending: false }).limit(10),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_blocked", true),
    supabase.from("access_keys").select("*", { count: "exact", head: true }).eq("is_active", true),
  ]);

  const totalRevenue = payments?.reduce((s: number, p: any) => s + Number(p.amount), 0) ?? 0;

  const stats = [
    { label: "Jami foydalanuvchi", value: totalUsers ?? 0, icon: Users, color: "rgba(168,85,247,0.1)", ic: "#a855f7" },
    { label: "O'qituvchilar", value: totalTeachers ?? 0, icon: Users, color: "rgba(59,130,246,0.1)", ic: "#3b82f6" },
    { label: "Bloklangan", value: blockedUsers ?? 0, icon: Users, color: "rgba(239,68,68,0.1)", ic: "#ef4444" },
    { label: "Faol kalitlar", value: activeKeys ?? 0, icon: Award, color: "rgba(16,185,129,0.1)", ic: "#10b981" },
    { label: "Kurslar", value: totalCourses ?? 0, icon: BookOpen, color: "rgba(245,158,11,0.1)", ic: "#f59e0b" },
    { label: "Ro'yxatlar", value: totalEnrollments ?? 0, icon: TrendingUp, color: "rgba(139,92,246,0.1)", ic: "#8b5cf6" },
    { label: "Tugatilgan darslar", value: lessonsDone ?? 0, icon: BookOpen, color: "rgba(16,185,129,0.1)", ic: "#10b981" },
    { label: "Simulyator urinish", value: simulators ?? 0, icon: Award, color: "rgba(236,72,153,0.1)", ic: "#ec4899" },
    { label: "Jami daromad (UZS)", value: totalRevenue.toLocaleString(), icon: CreditCard, color: "rgba(16,185,129,0.1)", ic: "#10b981" },
    { label: "To'lovlar", value: payments?.length ?? 0, icon: CreditCard, color: "rgba(245,158,11,0.1)", ic: "#f59e0b" },
  ];

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>Statistika</h1>
        <p style={{ color: "var(--text-secondary)" }}>Platforma ko&apos;rsatkichlari</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="card p-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: s.color }}>
              <s.icon size={18} style={{ color: s.ic }} />
            </div>
            <div className="text-2xl font-bold mb-0.5" style={{ color: "var(--text-primary)" }}>{s.value}</div>
            <div className="text-xs leading-snug" style={{ color: "var(--text-secondary)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="p-5 border-b" style={{ borderColor: "var(--border)" }}>
          <h2 className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>
            So&apos;nggi ro&apos;yxatdan o&apos;tganlar
          </h2>
        </div>
        <div className="divide-y" style={{ borderColor: "var(--border)" }}>
          {recentUsers?.map((u: any, i: number) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[var(--bg-secondary)] transition-colors">
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white flex-shrink-0"
                style={{ background: u.is_blocked ? "#ef4444" : "linear-gradient(135deg,#a855f7,#ec4899)" }}>
                {u.full_name?.[0] ?? "?"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>{u.full_name}</div>
                <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>{u.email}</div>
              </div>
              <div className="flex items-center gap-2">
                {u.is_blocked && <span className="badge badge-red text-xs">Bloklangan</span>}
                <span className={`badge text-xs ${u.role === "admin" ? "badge-red" : "badge-blue"}`}>
                  {u.role === "admin" ? "Admin" : "O'qituvchi"}
                </span>
              </div>
              <span className="text-xs flex-shrink-0" style={{ color: "var(--text-tertiary)" }}>
                {new Date(u.created_at).toLocaleDateString("uz-UZ")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
