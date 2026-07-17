"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Loader2, RotateCcw, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
  time: string;
}

const DAILY_LIMIT = 10;

const SUGGESTIONS = [
  "Algoritm nima?",
  "Python da list bilan qanday ishlash kerak?",
  "SQL da JOIN qanday ishlaydi?",
  "HTML va CSS farqi nima?",
  "Attestatsiyada qanday savollar bo'ladi?",
];

export default function AIMentorPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [usedToday, setUsedToday] = useState(0);
  const [checkingLimit, setCheckingLimit] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Load today's usage from DB
  const loadUsage = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];
    const { count } = await supabase
      .from("ai_mentor_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", `${today}T00:00:00`)
      .lte("created_at", `${today}T23:59:59`);
    setUsedToday(count ?? 0);
    setCheckingLimit(false);
  }, [supabase]);

  useEffect(() => {
    loadUsage();
    setMessages([{
      role: "assistant",
      content: "Assalomu alaykum! Men BilimMakon AI Mentori.\n\nFaqat **Informatika** fani bo'yicha yordam beraman:\n• Algoritmlar va dasturlash\n• Python, JavaScript, HTML, CSS\n• SQL va ma'lumotlar bazasi\n• Kompyuter savodxonligi\n• Attestatsiya mavzulari\n\nSavolingizni yozing! 👇",
      time: now(),
    }]);
  }, [loadUsage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function now() {
    return new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
  }

  async function send(text?: string) {
    const userText = (text ?? input).trim();
    if (!userText || loading) return;
    if (usedToday >= DAILY_LIMIT) {
      toast.error("Bugungi AI Mentor limiti tugadi. Ertaga yana foydalanishingiz mumkin.");
      return;
    }

    const userMsg: Message = { role: "user", content: userText, time: now() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Log to DB
      await supabase.from("ai_mentor_logs").insert({ user_id: user.id, question: userText });
      setUsedToday(prev => prev + 1);

      // Call AI
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Xatolik");

      setMessages(prev => [...prev, { role: "assistant", content: data.content, time: now() }]);
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Kechirasiz, hozir javob berib bo'lmadi. Iltimos, qayta urinib ko'ring.",
        time: now(),
      }]);
    } finally {
      setLoading(false);
    }
  }

  const limitReached = usedToday >= DAILY_LIMIT;
  const remaining = DAILY_LIMIT - usedToday;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#a855f7,#7c3aed)" }}>
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>AI Mentor</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Informatika bo'yicha yordam</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Daily limit indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm"
            style={{
              background: limitReached ? "rgba(239,68,68,0.08)" : "rgba(168,85,247,0.06)",
              border: `1px solid ${limitReached ? "rgba(239,68,68,0.2)" : "rgba(168,85,247,0.15)"}`,
              color: limitReached ? "#ef4444" : "#a855f7",
            }}>
            <span className="font-semibold">{usedToday}/{DAILY_LIMIT}</span>
            <span className="text-xs opacity-70">bugun</span>
          </div>
          <button onClick={() => {
            setMessages([{
              role: "assistant",
              content: "Yangi suhbat boshlandi! Savolingizni yozing.",
              time: now(),
            }]);
          }} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-secondary)] transition-colors"
            style={{ color: "var(--text-secondary)" }}>
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Limit reached banner */}
      {limitReached && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl mb-4 flex-shrink-0"
          style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <AlertCircle size={17} className="text-red-500 flex-shrink-0" />
          <p className="text-sm" style={{ color: "var(--text-primary)" }}>
            Bugungi AI Mentor limiti tugadi <span className="font-bold">({DAILY_LIMIT}/10)</span>.
            Ertaga yangilanadi.
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === "assistant"
                ? "bg-gradient-to-br from-violet-500 to-purple-700"
                : "bg-gradient-to-br from-purple-500 to-purple-700"
            }`}>
              {msg.role === "assistant" ? <Bot size={15} className="text-white" /> : <User size={15} className="text-white" />}
            </div>
            <div className={`max-w-[78%] flex flex-col ${msg.role === "user" ? "items-end" : "items-start"} gap-1`}>
              <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user" ? "rounded-tr-md text-white" : "rounded-tl-md"
              }`}
                style={msg.role === "user"
                  ? { background: "linear-gradient(135deg,#a855f7,#7c3aed)" }
                  : { background: "var(--bg-secondary)", color: "var(--text-primary)", border: "1px solid var(--border)" }
                }>
                {msg.content}
              </div>
              <span className="text-xs px-1" style={{ color: "var(--text-tertiary)" }}>{msg.time}</span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
              <Bot size={15} className="text-white" />
            </div>
            <div className="rounded-2xl rounded-tl-md px-4 py-3"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
              <div className="flex gap-1.5 items-center h-5">
                {[0,1,2].map(j => (
                  <span key={j} className="w-2 h-2 rounded-full bg-purple-500 animate-bounce"
                    style={{ animationDelay: `${j * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Suggestions — show only when no user messages yet */}
        {messages.length === 1 && !loading && (
          <div className="flex flex-wrap gap-2 pl-11">
            {SUGGESTIONS.map(s => (
              <button key={s} onClick={() => send(s)}
                className="text-sm px-3 py-1.5 rounded-xl transition-all hover:scale-105"
                style={{ background: "rgba(168,85,247,0.08)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.2)" }}>
                {s}
              </button>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t pt-4" style={{ borderColor: "var(--border)" }}>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && !limitReached && send()}
            className="input flex-1"
            placeholder={limitReached ? "Limit tugadi. Ertaga qaytib keling." : "Informatika haqida savol bering..."}
            disabled={loading || limitReached}
          />
          <button onClick={() => send()} disabled={!input.trim() || loading || limitReached}
            className="btn-primary px-4 disabled:opacity-40">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
        <p className="text-xs mt-2 text-center" style={{ color: "var(--text-tertiary)" }}>
          {checkingLimit ? "..." : limitReached
            ? "Limit tugadi — ertaga yangilanadi"
            : `Bugun ${remaining} ta savol qoldi`}
        </p>
      </div>
    </div>
  );
}
