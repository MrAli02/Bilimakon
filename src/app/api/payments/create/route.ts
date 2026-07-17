import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { notifyAdmin } from "@/lib/telegram";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: s } = await supabase.from("settings").select("value").eq("key", "simulator_price").single();
    const amount = Number(s?.value ?? 50000);

    const { data: payment, error } = await supabase
      .from("payments")
      .insert({ user_id: user.id, amount, currency: "UZS", status: "pending" })
      .select().single();

    if (error) throw error;

    const { data: profile } = await supabase.from("profiles").select("full_name, email").eq("id", user.id).single();
    await notifyAdmin(
      `💳 <b>Yangi to'lov so'rovi!</b>\n\n👤 ${profile?.full_name} (${profile?.email})\n💰 ${amount.toLocaleString()} UZS\n🔑 ID: <code>${payment.id}</code>\n\nTasdiqlash uchun: /confirm_payment ${payment.id}`
    );

    return NextResponse.json({ paymentId: payment.id, amount });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server xatosi";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
