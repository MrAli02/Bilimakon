import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";

export default async function CoursesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: courses } = await supabase
    .from("courses")
    .select("*, modules(id)")
    .eq("is_published", true)
    .order("order_index");

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("course_id, progress_percentage")
    .eq("user_id", user!.id);

  const enrolled = new Set(enrollments?.map((e: any) => e.course_id));
  const progress: Record<string, number> = {};
  enrollments?.forEach((e: any) => { progress[e.course_id] = e.progress_percentage; });

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>Kurslar</h1>
        <p style={{ color: "var(--text-secondary)" }}>Attestatsiyaga tayyorlanish uchun kurslar</p>
      </div>

      {courses && courses.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-5">
          {courses.map((course: any) => {
            const isEnrolled = enrolled.has(course.id);
            const pct = progress[course.id] ?? 0;
            return (
              <Link key={course.id} href={`/courses/${course.id}`}
                className="card overflow-hidden group hover:border-purple-200 transition-all">
                {/* Top color bar */}
                <div className="h-2 w-full" style={{ background: "linear-gradient(90deg,#a855f7,#7c3aed)" }} />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "linear-gradient(135deg,#a855f7,#7c3aed)", boxShadow: "0 4px 12px rgba(124,58,237,0.25)" }}>
                      <BookOpen size={22} className="text-white" />
                    </div>
                    <div className="flex gap-2">
                      <span className="badge-blue text-xs">{course.subject ?? "Informatika"}</span>
                      {isEnrolled && <span className="badge-green text-xs">Ro'yxatda</span>}
                    </div>
                  </div>
                  <h3 className="font-bold text-base mb-1 group-hover:text-purple-600 transition-colors"
                    style={{ color: "var(--text-primary)" }}>
                    {course.title}
                  </h3>
                  <p className="text-sm mb-4 line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                    {course.description}
                  </p>
                  <div className="flex items-center justify-between text-xs mb-3" style={{ color: "var(--text-tertiary)" }}>
                    <span>{course.modules?.length ?? 0} modul</span>
                    {isEnrolled && <span className="font-semibold" style={{ color: "#a855f7" }}>{pct}% bajarildi</span>}
                  </div>
                  {isEnrolled && (
                    <div className="progress-bar mb-3">
                      <div className="progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-sm font-semibold" style={{ color: "#a855f7" }}>
                    {isEnrolled ? "Davom ettirish" : "Boshlash"}
                    <ChevronRight size={15} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="card p-14 text-center">
          <BookOpen size={36} className="mx-auto mb-3" style={{ color: "var(--text-tertiary)" }} />
          <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Hali kurslar yo'q</p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Administrator tez orada kurslar qo'shadi</p>
        </div>
      )}
    </div>
  );
}
