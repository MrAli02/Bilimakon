import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { BookOpen, Play, CheckCircle, Lock, ChevronRight, Clock, Award } from "lucide-react";

export default async function CourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: course } = await supabase
    .from("courses")
    .select("*, modules(*, lessons(*, lesson_progress(*)))")
    .eq("id", courseId).single();

  if (!course) notFound();

  // Auto-enroll
  let { data: enrollment } = await supabase
    .from("enrollments").select("*").eq("user_id", user.id).eq("course_id", courseId).single();

  if (!enrollment) {
    const { data: newEnr } = await supabase.from("enrollments")
      .insert({ user_id: user.id, course_id: courseId, progress_percentage: 0 })
      .select().single();
    enrollment = newEnr;
  }

  const modules = [...(course.modules ?? [])].sort((a: any, b: any) => a.order_index - b.order_index);
  const allLessons = modules.flatMap((m: any) => m.lessons ?? []);
  const completedLessons = allLessons.filter((l: any) =>
    l.lesson_progress?.some((p: any) => p.user_id === user.id && p.is_completed)
  ).length;
  const overallProgress = allLessons.length > 0 ? Math.round((completedLessons / allLessons.length) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* Hero */}
      <div className="rounded-2xl p-6 mb-6 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#a855f7,#7c3aed)" }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        <div className="relative">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-purple-200 mb-3 inline-block"
            style={{ background: "rgba(255,255,255,0.15)" }}>
            {course.subject}
          </span>
          <h1 className="text-2xl font-bold text-white mb-1">{course.title}</h1>
          <p className="text-purple-100 text-sm mb-4">{course.description}</p>
          <div className="flex items-center gap-5 text-sm text-purple-200 mb-4">
            <span className="flex items-center gap-1"><BookOpen size={14} />{modules.length} modul</span>
            <span className="flex items-center gap-1"><Play size={14} />{allLessons.length} dars</span>
            <span className="flex items-center gap-1"><CheckCircle size={14} />{completedLessons} bajarildi</span>
          </div>
          <div>
            <div className="flex justify-between text-sm text-purple-200 mb-1.5">
              <span>Umumiy progress</span>
              <span className="font-bold text-white">{overallProgress}%</span>
            </div>
            <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }}>
              <div className="h-full rounded-full bg-white transition-all" style={{ width: `${overallProgress}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Modules */}
      {modules.length === 0 ? (
        <div className="card p-12 text-center">
          <BookOpen size={32} className="mx-auto mb-3" style={{ color: "var(--text-tertiary)" }} />
          <p style={{ color: "var(--text-secondary)" }}>Hali modullar qo'shilmagan</p>
        </div>
      ) : (
        <div className="space-y-3">
          {modules.map((mod: any, mIdx: number) => {
            const lessons = [...(mod.lessons ?? [])].sort((a: any, b: any) => a.order_index - b.order_index);
            const modCompleted = lessons.filter((l: any) =>
              l.lesson_progress?.some((p: any) => p.user_id === user.id && p.is_completed)
            ).length;
            const allDone = lessons.length > 0 && modCompleted === lessons.length;
            const prevModDone = mIdx === 0 || (() => {
              const prev = modules[mIdx - 1];
              const prevLessons = prev.lessons ?? [];
              return prevLessons.every((l: any) =>
                l.lesson_progress?.some((p: any) => p.user_id === user.id && p.is_completed)
              );
            })();
            const isLocked = !prevModDone && mIdx > 0;

            return (
              <div key={mod.id} className="card overflow-hidden">
                <div className="p-4 flex items-center gap-3"
                  style={{ background: isLocked ? "var(--bg-secondary)" : "var(--surface)" }}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm text-white ${isLocked ? "opacity-40" : ""}`}
                    style={{ background: allDone ? "#10b981" : isLocked ? "var(--bg-tertiary)" : "linear-gradient(135deg,#a855f7,#7c3aed)" }}>
                    {allDone ? <CheckCircle size={18} /> : isLocked ? <Lock size={16} className="text-gray-400" /> : mIdx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm" style={{ color: isLocked ? "var(--text-tertiary)" : "var(--text-primary)" }}>
                      {mod.title}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                      {modCompleted}/{lessons.length} dars · O'tish bali: {mod.passing_score}%
                    </p>
                  </div>
                  {allDone && (
                    <Link href={`/courses/${courseId}/exam/${mod.id}`}
                      className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all"
                      style={{ background: "rgba(168,85,247,0.08)", color: "#a855f7" }}>
                      <Award size={13} /> Imtihon
                    </Link>
                  )}
                  {isLocked && <span className="badge-yellow text-xs">Qulflangan</span>}
                </div>

                {!isLocked && (
                  <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                    {lessons.map((lesson: any, lIdx: number) => {
                      const lProgress = lesson.lesson_progress?.find((p: any) => p.user_id === user.id);
                      const isDone = lProgress?.is_completed;
                      const prevDone = lIdx === 0 ||
                        lessons[lIdx - 1]?.lesson_progress?.some((p: any) => p.user_id === user.id && p.is_completed);
                      const lLocked = !prevDone && lIdx > 0;

                      return lLocked ? (
                        <div key={lesson.id} className="flex items-center gap-3 px-4 py-3"
                          style={{ background: "var(--bg-secondary)" }}>
                          <Lock size={14} style={{ color: "var(--text-tertiary)" }} />
                          <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>{lesson.title}</span>
                        </div>
                      ) : (
                        <Link key={lesson.id} href={`/courses/${courseId}/lessons/${lesson.id}`}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-secondary)] transition-colors group">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isDone ? "bg-green-100 dark:bg-green-900" : "bg-[rgba(168,85,247,0.1)]"}`}>
                            {isDone ? <CheckCircle size={14} className="text-green-600" /> : <Play size={13} style={{ color: "#a855f7" }} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                              {mIdx + 1}.{lIdx + 1}. {lesson.title}
                            </p>
                            {lesson.duration_seconds && (
                              <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                                <Clock size={11} />{Math.round(lesson.duration_seconds / 60)} daq
                              </p>
                            )}
                          </div>
                          {isDone && lProgress?.quiz_passed && <span className="badge-green text-xs">Quiz ✓</span>}
                          <ChevronRight size={15} className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                            style={{ color: "var(--text-tertiary)" }} />
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
