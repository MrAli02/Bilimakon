"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, CreditCard, Send, Loader2, Copy, RefreshCw, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

interface Props {
  activeAttempt: { id: string; started_at: string } | null;
  price: number;
  hasConfirmedPayment: boolean;
}

type Step = "idle" | "pending" | "polling";

export default function SimulatorGate({ activeAttempt, price, hasConfirmedPayment }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("idle");
  const [paymentId, setPaymentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const ADMIN_TG = process.env.NEXT_PUBLIC_ADMIN_TELEGRAM ?? "bilimmakon_admin";
  const supabase = createClient();

  async function createPayment() {
    setLoading(true);
    try {
      const res = await fetch("/api/payments/create", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Xatolik"); return; }
      setPaymentId(data.paymentId);
      setStep("pending");
      pollPayment(data.paymentId);
    } catch { toast.error("Xatolik yuz berdi"); }
    finally { setLoading(false); }
  }

  function pollPayment(pid: string) {
    setStep("polling");
    const iv = setInterval(async () => {
      const { data } = await supabase.from("payments").select("status").eq("id", pid).single();
      if (data?.status === "confirmed") {
        clearInterval(iv);
        toast.success("To'lov tasdiqlandi!");
        window.location.reload();
      }
    }, 5000);
    setTimeout(() => clearInterval(iv), 30 * 60 * 1000);
  }

  async function startSimulator() {
    setStarting(true);
    try {
      const res = await fetch("/api/simulator/start", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Xatolik"); return; }
      router.push("/tests/simulator/start");
    } catch { toast.error("Xatolik yuz berdi"); }
    finally { setStarting(false); }
  }

  function copy() {
    navigator.clipboard.writeText(paymentId);
    toast.success("Nusxalandi!");
  }

  if (activeAttempt) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
          <span className="font-semibold text-green-600">Faol urinish mavjud</span>
        </div>
        <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
          To'lovingiz tasdiqlangan. Simulyatorni davom ettirishingiz mumkin.
        </p>
        <button onClick={() => router.push("/tests/simulator/start")}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-all hover:scale-105"
          style={{ background: "linear-gradient(135deg,#a855f7,#7c3aed)" }}>
          <Play size={18} fill="white" /> Simulyatorni davom ettirish
        </button>
      </div>
    );
  }

  if (hasConfirmedPayment) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
          <span className="font-semibold text-green-600">To'lov tasdiqlangan</span>
        </div>
        <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
          Endi simulyatorni boshlashingiz mumkin. Diqqat: boshlagach vaqt hisoblanadi.
        </p>
        <button onClick={startSimulator} disabled={starting}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-all hover:scale-105"
          style={{ background: "linear-gradient(135deg,#a855f7,#7c3aed)" }}>
          {starting ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} fill="white" />}
          {starting ? "Boshlanmoqda..." : "Simulyatorni boshlash"}
        </button>
      </div>
    );
  }

  if (step === "pending" || step === "polling") {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          {step === "polling"
            ? <><span className="w-2.5 h-2.5 rounded-full bg-yellow-500 animate-pulse" /><span className="font-semibold text-yellow-600">To'lov kutilmoqda...</span></>
            : <><Clock size={18} style={{ color: "#f59e0b" }} /><span className="font-semibold" style={{ color: "var(--text-primary)" }}>To'lov ID</span></>
          }
        </div>
        <div className="flex items-center gap-2 mb-5">
          <code className="flex-1 px-4 py-3 rounded-xl font-mono font-bold text-center text-base"
            style={{ background: "var(--bg-secondary)", color: "#a855f7" }}>
            {paymentId}
          </code>
          <button onClick={copy} className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-[var(--bg-secondary)]"
            style={{ border: "1.5px solid var(--border)", color: "var(--text-secondary)" }}>
            <Copy size={16} />
          </button>
        </div>
        <a href={`https://t.me/${ADMIN_TG}?text=${encodeURIComponent(`To'lov ID: ${paymentId}\nSimulyator uchun to'lov qildim.`)}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm text-white transition-all hover:scale-[1.02]"
          style={{ background: "linear-gradient(135deg,#0088cc,#006aab)" }}>
          <Send size={16} /> Adminga Telegram orqali yozish
        </a>
        {step === "polling" && (
          <p className="text-xs text-center mt-3 flex items-center justify-center gap-1.5" style={{ color: "var(--text-tertiary)" }}>
            <RefreshCw size={12} className="animate-spin" /> Admin tasdiqlaguncha kutilmoqda...
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-sm mb-0.5" style={{ color: "var(--text-secondary)" }}>To'lov miqdori</p>
          <p className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{price.toLocaleString()} UZS</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>1 marta urinish huquqi</p>
        </div>
        <CreditCard size={32} style={{ color: "var(--text-tertiary)" }} />
      </div>
      <button onClick={createPayment} disabled={loading}
        className="btn-primary w-full justify-center py-3.5">
        {loading ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
        {loading ? "Yuklanmoqda..." : "To'lov qilish"}
      </button>
      <p className="text-xs text-center mt-3" style={{ color: "var(--text-tertiary)" }}>
        Telegram orqali admin tasdiqlashidan keyin avtomatik ochiladi
      </p>
    </div>
  );
}