import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendTelegramMessage } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get("x-telegram-bot-api-secret-token");
    if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const update = await req.json();
    const msg = update.message;
    if (!msg) return NextResponse.json({ ok: true });

    const chatId = msg.chat.id;
    const text = msg.text ?? "";

    // /start
    if (text === "/start") {
      await sendTelegramMessage(chatId,
        `👋 <b>BilimMakon botiga xush kelibsiz!</b>\n\n📚 Bu bot orqali:\n• To'lov tasdiqlash\n• Kirish kaliti olish\n\n🌐 Platforma: <a href="${process.env.NEXT_PUBLIC_APP_URL}">${process.env.NEXT_PUBLIC_APP_URL}</a>`
      );
      return NextResponse.json({ ok: true });
    }

    // /confirm_payment <paymentId>
    if (text.startsWith("/confirm_payment ")) {
      const paymentId = text.split(" ")[1]?.trim();
      if (!paymentId) return NextResponse.json({ ok: true });

      const supabase = await createAdminClient();

      const { data: payment } = await supabase
        .from("payments")
        .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
        .eq("id", paymentId)
        .eq("status", "pending")
        .select("user_id, amount")
        .single();

      if (payment) {
        await supabase.from("simulator_attempts").insert({
          user_id: payment.user_id,
          payment_id: paymentId,
          status: "active",
        });
        await sendTelegramMessage(chatId,
          `✅ To'lov tasdiqlandi!\n💰 ${Number(payment.amount).toLocaleString()} UZS\n🎯 Simulyator ochildi.`
        );
        // Notify user
        const { data: profile } = await supabase
          .from("profiles").select("telegram_id").eq("id", payment.user_id).single();
        if (profile?.telegram_id) {
          await sendTelegramMessage(profile.telegram_id,
            `✅ <b>To'lovingiz tasdiqlandi!</b>\n\n🎯 Attestatsiya simulyatori sizga ochildi.\nPlatformaga kirib boshlang!`
          );
        }
      } else {
        await sendTelegramMessage(chatId, "❌ To'lov topilmadi yoki allaqachon tasdiqlangan.");
      }
      return NextResponse.json({ ok: true });
    }

    // /help
    if (text === "/help") {
      await sendTelegramMessage(chatId,
        `🆘 <b>BilimMakon Bot Yordam</b>\n\n/confirm_payment [ID] — To'lovni tasdiqlash\n\nSavollar uchun: @${process.env.NEXT_PUBLIC_ADMIN_TELEGRAM ?? "bilimmakon_admin"}`
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Telegram webhook error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
