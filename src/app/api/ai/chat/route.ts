import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const SYSTEM = `Siz BilimMakon platformasining AI Mentori siz.
Faqat INFORMATIKA fani bo'yicha savollar qabul qilasiz:
- Algoritmlar, dasturlash tillari (Python, JavaScript, HTML, CSS, SQL)
- Kompyuter tarmoqlari, ma'lumotlar bazasi
- Kompyuter savodxonligi
- O'zbekiston o'qituvchi attestatsiya mavzulari (Informatika)

Agar foydalanuvchi BOSHQA fan (matematika, fizika, tarix va h.k.) haqida so'rasa:
"Men faqat BilimMakon platformasidagi Informatika fani bo'yicha yordam bera olaman." deb javob bering.

Har doim O'zbek tilida, qisqa va aniq javob bering.`;

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { messages } = await req.json() as { messages: ChatMessage[] };
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: SYSTEM,
        messages: messages.filter((m) => m.role !== "system").slice(-10),
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "AI xatolik" }, { status: 500 });
    }

    const data = await res.json();
    const content = data.content?.[0]?.text ?? "Javob olib bo'lmadi.";
    return NextResponse.json({ content });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server xatosi";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
