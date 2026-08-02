import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// .env.local faylida bo'lishi kerak:
// TELEGRAM_BOT_TOKEN=...
// TELEGRAM_GROUP_CHAT_ID=-1002284102679

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Kirish talab qilinadi" }, { status: 401 });
  }

  // Platforma a'zosi — kirish kaliti orqali ro'yxatdan o'tgan (ya'ni to'lov qilgan) foydalanuvchi
  const { data: profile } = await supabase
    .from("profiles")
    .select("access_key_id")
    .eq("id", user.id)
    .single();

  if (!profile?.access_key_id) {
    return NextResponse.json(
      { error: "Faqat platforma a'zolari guruhga qo'shilishi mumkin" },
      { status: 403 }
    );
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_GROUP_CHAT_ID;

  if (!botToken || !chatId) {
    return NextResponse.json({ error: "Server sozlamalari to'liq emas" }, { status: 500 });
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/createChatInviteLink`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        member_limit: 1, // faqat 1 kishi kirishi mumkin
        name: `Taklif — ${user.email ?? user.id}`,
      }),
    });

    const data = await res.json();

    if (!data.ok) {
      return NextResponse.json({ error: data.description ?? "Telegram xatoligi" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, inviteLink: data.result.invite_link });
  } catch {
    return NextResponse.json({ error: "Havola yaratishda xatolik yuz berdi" }, { status: 500 });
  }
}
