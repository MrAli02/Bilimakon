import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import LessonClient from "@/components/course/lesson-client";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: lesson } = await supabase
    .from("lessons")
    .select("*, modules(*, courses(*))")
    .eq("id", lessonId)
    .single();

  if (!lesson) notFound();

  const [{ data: questions }, { data: progress }, { data: profile }, { data: nextLesson }] = await Promise.all([
    supabase.from("questions").select("*").eq("module_id", lesson.module_id),
    supabase.from("lesson_progress").select("*").eq("user_id", user.id).eq("lesson_id", lessonId).single(),
    supabase.from("profiles").select("full_name, id").eq("id", user.id).single(),
    supabase.from("lessons").select("id, title").eq("module_id", lesson.module_id)
      .gt("order_index", lesson.order_index).order("order_index").limit(1).single(),
  ]);

  return (
    <LessonClient
      lesson={lesson}
      questions={questions ?? []}
      initialProgress={progress}
      profile={profile}
      courseId={courseId}
      nextLesson={nextLesson}
      userId={user.id}
    />
  );
}
