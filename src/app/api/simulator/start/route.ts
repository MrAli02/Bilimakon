import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Kirish talab qilinadi" }, { status: 401 });

  const { data: payment } = await supabase
    .from("payments")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "confirmed")
    .eq("used", false)
    .order("confirmed_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!payment) {
    return NextResponse.json({ error: "Tasdiqlangan to'lov topilmadi" }, { status: 400 });
  }

  const { data: attempt, error } = await supabase
    .from("simulator_attempts")
    .insert({ user_id: user.id, payment_id: payment.id, status: "active", started_at: new Date().toISOString() })
    .select("id")
    .single();

  if (error || !attempt) {
    return NextResponse.json({ error: "Urinish yaratilmadi" }, { status: 500 });
  }

  await supabase.from("payments").update({ used: true }).eq("id", payment.id);

  return NextResponse.json({ ok: true, attemptId: attempt.id });
}