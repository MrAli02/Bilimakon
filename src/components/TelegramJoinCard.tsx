"use client";

import { useState } from "react";
import { Send, Loader2, ExternalLink, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

export default function TelegramJoinCard() {
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  async function getInvite() {
    setLoading(true);
    try {
      const res = await fetch("/api/telegram/invite", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Xatolik yuz berdi");
        return;
      }
      setInviteLink(data.inviteLink);
    } catch {
      toast.error("Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#0088cc,#006aab)" }}>
          <Send size={20} className="text-white" />
        </div>
        <div>
          <h2 className="font-bold" style={{ color: "var(--text-primary)" }}>Telegram guruhi</h2>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Yangiliklar va muloqot uchun</p>
        </div>
      </div>

      {inviteLink ? (
        <div>
          <div className="flex items-center gap-2 mb-3 p-3 rounded-xl" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)" }}>
            <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Havola tayyor — faqat bir marta ishlaydi
            </p>
          </div>
          <a href={inviteLink} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm text-white transition-all hover:scale-[1.02]"
            style={{ background: "linear-gradient(135deg,#0088cc,#006aab)" }}>
            <ExternalLink size={16} /> Guruhga o'tish
          </a>
        </div>
      ) : (
        <button onClick={getInvite} disabled={loading}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm text-white transition-all hover:scale-[1.02]"
          style={{ background: "linear-gradient(135deg,#0088cc,#006aab)" }}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {loading ? "Havola tayyorlanmoqda..." : "Telegram guruhga qo'shilish"}
        </button>
      )}
    </div>
  );
}
