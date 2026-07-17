import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ClipboardList, Award, ChevronRight, CheckCircle, XCircle } from "lucide-react";

export default async function TestsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get enrolled courses with modules
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("course_id, courses(id, title, subject, modules(id, title, order_index, passing_score))")
    .eq("user_id", user.id);

  // Get user's quiz attempts
  const { data: attempts } = await supabase
    .from("quiz_attempts")
    .select("module_id, score, total_questions, passed, finished_at")
    .eq("user_id", user.id)
    .eq("attempt_type", "module_exam")
    .order("finished_at", { ascending: false });

  // Map best score per module
  const bestScores: Record<string, { score: number; total: number; passed: boolean }> = {};
  attempts?.forEach((a: any) => {
    if (!bestScores[a.module_id] || a.score > bestScores[a.module_id].score) {
      bestScores[a.module_id] = { score: a.score, total: a.total_questions, passed: a.passed };
    }
  });

  // Simulator attempts
  const { data: simAttempts } = await supabase
    .from("simulator_attempts")
    .select("score, total_questions, passed, finished_at, status")
    .eq("user_id", user.id)
    .order("finished_at", { ascending: false })
    .limit(5);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>Testlar</h1>
        <p style={{ color: "var(--text-secondary)" }}>Modul imtihonlari va attestatsiya simulyatori</p>
      </div>

      {/* Attestation simulator */}
      <div className="card p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10 -translate-y-1/2 translate-x-1/2"
          style={{ background: "radial-gradient(circle,#f59e0b,transparent)" }} />
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(245,158,11,0.1)" }}>
              <Award size={24} style={{ color: "#f59e0b" }} />
            </div>
            <div>
              <h2 className="font-bold text-base mb-0.5" style={{ color: "var(--text-primary)" }}>
                Attestatsiya Simulyatori
              </h2>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Haqiqiy attestatsiya kabi 50 ta savol · 90 daqiqa · 70% o'tish bali
              </p>
            </div>
          </div>
          <Link href="/tests/simulator"
            className="btn-primary flex-shrink-0 text-sm">
            Boshlash <ChevronRight size={16} />
          </Link>
        </div>

        {simAttempts && simAttempts.length > 0 && (
          <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
            <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-tertiary)" }}>
              So'nggi urinishlar
            </p>
            <div className="space-y-1.5">
              {simAttempts.slice(0, 3).map((a: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span style={{ color: "var(--text-secondary)" }}>
                    {a.finished_at ? new Date(a.finished_at).toLocaleDateString("uz-UZ") : "Davom etmoqda"}
                  </span>
                  <div className="flex items-center gap-2">
                    {a.status === "active" ? (
                      <span className="badge-yellow">Davom etmoqda</span>
                    ) : (
                      <>
                        <span className="font-semibold" style={{ color: a.passed ? "#10b981" : "#ef4444" }}>
                          {a.score}/{a.total_questions} ({Math.round((a.score/a.total_questions)*100)}%)
                        </span>
                        <span className={`badge ${a.passed ? "badge-green" : "badge-red"}`}>
                          {a.passed ? "O'tdi" : "O'tmadi"}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Module exams */}
      <div>
        <h2 className="font-bold mb-3" style={{ color: "var(--text-primary)" }}>Modul imtihonlari</h2>
        {enrollments && enrollments.length > 0 ? (
          <div className="space-y-4">
            {enrollments.map((e: any) => {
              const modules = e.courses?.modules ?? [];
              if (modules.length === 0) return null;
              return (
                <div key={e.course_id} className="card overflow-hidden">
                  <div className="px-5 py-3.5 border-b" style={{ borderColor: "var(--border)" }}>
                    <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                      {e.courses?.title}
                    </h3>
                  </div>
                  <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                    {[...modules].sort((a: any, b: any) => a.order_index - b.order_index).map((mod: any) => {
                      const best = bestScores[mod.id];
                      return (
                        <div key={mod.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[var(--bg-secondary)] transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                              {mod.order_index}. {mod.title}
                            </div>
                            <div className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                              O'tish bali: {mod.passing_score}%
                            </div>
                          </div>
                          {best ? (
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-semibold" style={{ color: best.passed ? "#10b981" : "#ef4444" }}>
                                {Math.round((best.score / best.total) * 100)}%
                              </span>
                              {best.passed
                                ? <CheckCircle size={18} className="text-green-500" />
                                : <XCircle size={18} className="text-red-400" />}
                              <Link href={`/courses/${e.course_id}/exam/${mod.id}`}
                                className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:bg-[var(--bg-tertiary)]"
                                style={{ color: "#a855f7" }}>
                                Qayta
                              </Link>
                            </div>
                          ) : (
                            <Link href={`/courses/${e.course_id}/exam/${mod.id}`}
                              className="btn-primary text-xs px-3 py-1.5">
                              Boshlash
                            </Link>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card p-10 text-center">
            <ClipboardList size={30} className="mx-auto mb-3" style={{ color: "var(--text-tertiary)" }} />
            <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
              Test topshirish uchun avval kurslarga ro'yxatdan o'ting
            </p>
            <Link href="/courses" className="btn-primary text-sm">Kurslarga o'tish</Link>
          </div>
        )}
      </div>
    </div>
  );
}
