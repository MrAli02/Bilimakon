import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { courseId, lessonId, isCompleted } = await req.json();
    if (!lessonId) return NextResponse.json({ error: "lessonId required" }, { status: 400 });

    // Upsert lesson progress
    await supabase.from("lesson_progress").upsert({
      user_id: user.id,
      lesson_id: lessonId,
      is_completed: isCompleted ?? false,
      completed_at: isCompleted ? new Date().toISOString() : null,
    }, { onConflict: "user_id,lesson_id" });

    // Recalculate enrollment progress if courseId provided
    if (courseId && isCompleted) {
      const { data: allLessons } = await supabase
        .from("lessons")
        .select("id, modules!inner(course_id)")
        .eq("modules.course_id", courseId)
        .eq("is_published", true);

      if (allLessons && allLessons.length > 0) {
        const lessonIds = allLessons.map((l: { id: string }) => l.id);
        const { count: doneCount } = await supabase
          .from("lesson_progress")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_completed", true)
          .in("lesson_id", lessonIds);

        const pct = Math.round(((doneCount ?? 0) / allLessons.length) * 100);
        await supabase.from("enrollments")
          .update({
            progress_percentage: pct,
            completed_at: pct === 100 ? new Date().toISOString() : null,
          })
          .eq("user_id", user.id)
          .eq("course_id", courseId);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server xatosi";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
