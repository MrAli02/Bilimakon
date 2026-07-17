import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendAnnouncement } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { title, content } = await req.json();
    if (!title || !content) return NextResponse.json({ error: "title va content kerak" }, { status: 400 });

    const { data: profiles } = await supabase.from("profiles").select("telegram_id").not("telegram_id", "is", null);
    const chatIds = (profiles ?? [])
      .map((p: { telegram_id: string | null }) => p.telegram_id)
      .filter((id): id is string => id !== null);

    if (chatIds.length > 0) {
      await sendAnnouncement(chatIds, title, content);
    }

    return NextResponse.json({ ok: true, sent: chatIds.length });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server xatosi";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
