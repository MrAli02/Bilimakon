import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { courseId, lessonId, watchedSeconds, isCompleted } = body;
    if (!lessonId) return NextResponse.json({ error: "lessonId required" }, { status: 400 });

    // Faqat so'rovda haqiqatan kelgan maydonlarni yozamiz.
    // MUHIM: avvalgi versiyada is_completed har doim yozilar edi
    // (kelmasa ham `isCompleted ?? false` orqali FALSE bo'lib qolardi).
    // Sahifadan chiqishdagi beacon so'rovi ("use-effect"dagi flushBeacon,
    // pagehide/visibilitychange orqali) faqat { lessonId, watchedSeconds }
    // yuboradi, isCompleted umuman yubormaydi. Shu sabab foydalanuvchi
    // darsni tugatib (is_completed: true) keyingi darsga o'tayotganda,
    // beacon so'rovi o'sha "tugatilgan" darsni FALSE holatiga qaytarib
    // qo'yardi — aynan shu "oldingi modul videosi yo'qolib qolgan" kabi
    // ko'rinadigan xatoning bir manbai edi.
    const upsertData: Record<string, unknown> = {
      user_id: user.id,
      lesson_id: lessonId,
    };

    if (typeof watchedSeconds === "number" && Number.isFinite(watchedSeconds)) {
      upsertData.watched_seconds = Math.max(0, Math.floor(watchedSeconds));
    }

    if (typeof isCompleted === "boolean") {
      upsertData.is_completed = isCompleted;
      upsertData.completed_at = isCompleted ? new Date().toISOString() : null;
    }

    // Agar hech qanday real maydon kelmagan bo'lsa (faqat user_id/lesson_id),
    // bekorga upsert qilib DB'ga bo'sh yozuv tashlamaymiz.
    if (Object.keys(upsertData).length <= 2) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const { error: upsertError } = await supabase
      .from("lesson_progress")
      .upsert(upsertData, { onConflict: "user_id,lesson_id" });

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    // Kurs progressini faqat dars HAQIQATAN tugatilgan holatda qayta hisoblaymiz.
    if (courseId && isCompleted === true) {
      const { data: allLessons, error: lessonsError } = await supabase
        .from("lessons")
        .select("id, modules!inner(course_id)")
        .eq("modules.course_id", courseId)
        .eq("is_published", true);

      if (lessonsError) {
        console.error(lessonsError);
      } else if (allLessons && allLessons.length > 0) {
        const lessonIds = allLessons.map((l: { id: string }) => l.id);
        const { count: doneCount, error: countError } = await supabase
          .from("lesson_progress")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_completed", true)
          .in("lesson_id", lessonIds);

        if (countError) {
          console.error(countError);
        } else {
          const pct = Math.round(((doneCount ?? 0) / allLessons.length) * 100);
          const { error: enrollError } = await supabase
            .from("enrollments")
            .update({
              progress_percentage: pct,
              completed_at: pct === 100 ? new Date().toISOString() : null,
            })
            .eq("user_id", user.id)
            .eq("course_id", courseId);

          if (enrollError) console.error(enrollError);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server xatosi";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
