import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TrendingUp, BookOpen, CheckCircle, Award, Clock } from "lucide-react";

export default async function ProgressPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: enrollments },
    { data: lessonProgress },
    { data: quizAttempts },
    { data: simAttempts },
  ] = await Promise.all([
    supabase.from("enrollments").select("*, courses(title, subject)").eq("user_id", user.id),
    supabase.from("lesson_progress").select("is_completed, quiz_passed, quiz_score").eq("user_id", user.id),
    supabase.from("quiz_attempts").select("score, total_questions, passed, finished_at, attempt_type").eq("user_id", user.id).order("finished_at", { ascending: false }).limit(20),
    supabase.from("simulator_attempts").select("score, total_questions, passed, finished_at").eq("user_id", user.id).eq("status", "completed").order("finished_at", { ascending: false }),
  ]);

  const completedLessons = lessonProgress?.filter(p => p.is_completed).length ?? 0;
  const passedQuizzes = lessonProgress?.filter(p => p.quiz_passed).length ?? 0;
  const passedExams = quizAttempts?.filter(a => a.passed && a.attempt_type === "module_exam").length ?? 0;
  const passedSims = simAttempts?.filter(a => a.passed).length ?? 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>Progress</h1>
        <p style={{ color: "var(--text-secondary)" }}>O'rganish jarayonidagi natijalari</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Tugatilgan darslar", value: completedLessons, icon: BookOpen, color: "rgba(168,85,247,0.1)", ic: "#a855f7" },
          { label: "O'tilgan quizlar", value: passedQuizzes, icon: CheckCircle, color: "rgba(16,185,129,0.1)", ic: "#10b981" },
          { label: "Modul imtihonlari", value: passedExams, icon: Award, color: "rgba(245,158,11,0.1)", ic: "#f59e0b" },
          { label: "Simulyator (o'tdi)", value: passedSims, icon: TrendingUp, color: "rgba(59,130,246,0.1)", ic: "#3b82f6" },
        ].map(s => (
          <div key={s.label} className="card p-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: s.color }}>
              <s.icon size={18} style={{ color: s.ic }} />
            </div>
            <div className="text-2xl font-bold mb-0.5" style={{ color: "var(--text-primary)" }}>{s.value}</div>
            <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Course progress */}
      {enrollments && enrollments.length > 0 && (
        <div>
          <h2 className="font-bold mb-3" style={{ color: "var(--text-primary)" }}>Kurs progressi</h2>
          <div className="space-y-3">
            {enrollments.map((e: any) => (
              <div key={e.course_id} className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{e.courses?.title}</p>
                    <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{e.courses?.subject}</p>
                  </div>
                  <span className="text-lg font-bold" style={{ color: "#a855f7" }}>{e.progress_percentage ?? 0}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${e.progress_percentage ?? 0}%` }} />
                </div>
                {e.completed_at && (
                  <p className="text-xs mt-2 text-green-600 flex items-center gap-1">
                    <CheckCircle size={12} /> {new Date(e.completed_at).toLocaleDateString("uz-UZ")} da tugatildi
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quiz history */}
      {quizAttempts && quizAttempts.length > 0 && (
        <div>
          <h2 className="font-bold mb-3" style={{ color: "var(--text-primary)" }}>Test natijalari tarixi</h2>
          <div className="card overflow-hidden">
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {quizAttempts.map((a: any, i: number) => (
                <div key={i} className="flex items-center justify-between px-5 py-3.5 hover:bg-[var(--bg-secondary)] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${a.passed ? "bg-green-500" : "bg-red-400"}`} />
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        {a.attempt_type === "module_exam" ? "Modul imtihoni" :
                         a.attempt_type === "lesson_quiz" ? "Dars quizi" : "Simulyator"}
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                        <Clock size={10} className="inline mr-1" />
                        {new Date(a.finished_at).toLocaleDateString("uz-UZ")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold" style={{ color: a.passed ? "#10b981" : "#ef4444" }}>
                      {a.score}/{a.total_questions} ({Math.round((a.score / a.total_questions) * 100)}%)
                    </span>
                    <span className={`badge ${a.passed ? "badge-green" : "badge-red"}`}>
                      {a.passed ? "O'tdi" : "O'tmadi"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!enrollments?.length && !quizAttempts?.length && (
        <div className="card p-12 text-center">
          <TrendingUp size={36} className="mx-auto mb-3" style={{ color: "var(--text-tertiary)" }} />
          <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Hali progress yo'q</p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Kurslarni boshlang va progress bu yerda ko'rinadi
          </p>
        </div>
      )}
    </div>
  );
}
