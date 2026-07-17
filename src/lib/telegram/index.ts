const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID!;
const BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

export async function sendTelegramMessage(chatId: string | number, text: string): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
    return res.ok;
  } catch { return false; }
}

export async function notifyAdmin(message: string): Promise<void> {
  if (!ADMIN_CHAT_ID) return;
  await sendTelegramMessage(ADMIN_CHAT_ID, message);
}

export async function sendAnnouncement(chatIds: string[], title: string, content: string): Promise<void> {
  const text = `📢 <b>${title}</b>\n\n${content}`;
  await Promise.allSettled(chatIds.map(id => sendTelegramMessage(id, text)));
}
