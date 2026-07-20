import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen, ClipboardList, ChevronRight, Play } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("full_name, email").eq("id", user.id).single();

  const [{ data: enrollments }, { data: progress }, { data: attempts }] = await Promise.all([
    supabase.from("enrollments").select("course_id, progress_percentage, courses(title)").eq("user_id", user.id).limit(3),
    supabase.from("lesson_progress").select("id").eq("user_id", user.id).eq("is_completed", true),
    supabase.from("quiz_attempts").select("score, total_questions, passed, finished_at").eq("user_id", user.id).order("finished_at", { ascending: false }).limit(3),
  ]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Xayrli tong" : hour < 18 ? "Xayrli kun" : "Xayrli kech";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="rounded-2xl p-6 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#a855f7,#7c3aed)" }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        <div className="relative">
          <p className="text-purple-200 text-sm mb-1">{greeting},</p>
          <h1 className="text-2xl font-bold text-white mb-4">{profile?.full_name ?? "O'qituvchi"} 👋</h1>
          <Link href="/courses"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-white text-purple-700 hover:bg-purple-50 transition-all">
            O'rganishni davom ettirish <ChevronRight size={15} />
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Kurslar", value: enrollments?.length ?? 0, icon: BookOpen, grad: "linear-gradient(135deg,#a855f7,#7c3aed)" },
          { label: "Tugatilgan darslar", value: progress?.length ?? 0, icon: Play, grad: "linear-gradient(135deg,#10b981,#059669)" },
          { label: "Test urinishlari", value: attempts?.length ?? 0, icon: ClipboardList, grad: "linear-gradient(135deg,#f59e0b,#d97706)" },
        ].map(s => (
          <div key={s.label} className="card p-4">
<div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
              style={{ background: s.grad, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
              <s.icon size={20} className="text-white" />
            </div>
            <div className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{s.value}</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Courses */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold" style={{ color: "var(--text-primary)" }}>Mening kurslarim</h2>
            <Link href="/courses" className="text-sm font-medium flex items-center gap-1" style={{ color: "#a855f7" }}>
              Barchasi <ChevronRight size={14} />
            </Link>
          </div>
          {enrollments && enrollments.length > 0 ? (
            <div className="space-y-2">
              {enrollments.map((e: any) => (
                <Link key={e.course_id} href={`/courses/${e.course_id}`}
                  className="card p-4 flex items-center gap-3 group hover:border-purple-200 transition-all">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(168,85,247,0.1)" }}>
                    <BookOpen size={19} style={{ color: "#a855f7" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate mb-1.5" style={{ color: "var(--text-primary)" }}>
                      {e.courses?.title}
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${e.progress_percentage ?? 0}%` }} />
                    </div>
                  </div>
                  <span className="text-xs font-semibold flex-shrink-0" style={{ color: "#a855f7" }}>
                    {e.progress_percentage ?? 0}%
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="card p-8 text-center">
              <BookOpen size={28} className="mx-auto mb-3" style={{ color: "var(--text-tertiary)" }} />
              <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>Hali kurs yo'q</p>
              <Link href="/courses" className="btn-primary text-sm">Kurslarni ko'rish</Link>
            </div>
          )}
        </div>

        {/* Recent tests */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold" style={{ color: "var(--text-primary)" }}>So'nggi testlar</h2>
            <Link href="/tests" className="text-sm font-medium flex items-center gap-1" style={{ color: "#a855f7" }}>
              Testlar <ChevronRight size={14} />
            </Link>
          </div>
          {attempts && attempts.length > 0 ? (
            <div className="space-y-2">
              {attempts.map((a: any, i: number) => (
                <div key={i} className="card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${a.passed ? "bg-green-500" : "bg-red-400"}`} />
                    <div>
                      <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        {a.score}/{a.total_questions} to'g'ri
                      </div>
                      <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                        {new Date(a.finished_at).toLocaleDateString("uz-UZ")}
                      </div>
                    </div>
                  </div>
                  <span className={`badge ${a.passed ? "badge-green" : "badge-red"}`}>
                    {Math.round((a.score / a.total_questions) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-8 text-center">
              <ClipboardList size={28} className="mx-auto mb-3" style={{ color: "var(--text-tertiary)" }} />
              <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>Hali test topshirilmagan</p>
              <Link href="/tests" className="btn-primary text-sm">Testlarga o'tish</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
