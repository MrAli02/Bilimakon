"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Shield, Mail, Lock, Eye, EyeOff, Loader2,
  AlertTriangle, Clock, KeyRound
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminSecret, setAdminSecret] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [blocked, setBlocked] = useState(false);
  const [blockedUntil, setBlockedUntil] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [needSecret, setNeedSecret] = useState(false);

  // Countdown timer for block
  useEffect(() => {
    if (!blockedUntil) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, blockedUntil.getTime() - Date.now());
      setCountdown(Math.ceil(remaining / 1000));
      if (remaining <= 0) {
        setBlocked(false);
        setBlockedUntil(null);
        setAttempts(0);
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [blockedUntil]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (blocked) return;
    setLoading(true);

    try {
      // Call server API (rate limiting handled server-side)
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, adminSecret }),
      });

      const data = await res.json();

      if (res.status === 429) {
        // Rate limited / blocked
        setBlocked(true);
        if (data.blockedUntil) setBlockedUntil(new Date(data.blockedUntil));
        toast.error(data.error ?? "Juda ko'p urinish!");
        return;
      }

      if (!res.ok) {
        const remaining = data.remainingAttempts ?? 0;
        setAttempts(prev => prev + 1);

        if (data.error?.includes("maxfiy kalit")) {
          toast.error("Admin maxfiy kalit noto'g'ri!");
        } else if (data.error?.includes("admin emas")) {
          toast.error("Bu hisob admin emas. Oddiy kirish sahifasidan foydalaning.");
        } else {
          toast.error(
            remaining > 0
              ? `Noto'g'ri ma'lumot. ${remaining} ta urinish qoldi.`
              : "Akkaunt vaqtincha bloklandi!"
          );
        }

        if (remaining === 0) {
          setBlocked(true);
          setBlockedUntil(new Date(Date.now() + 15 * 60 * 1000));
        }
        return;
      }

      // Success — now do client-side sign in
      const supabase = createClient();
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signInErr) {
        toast.error("Kirish xatosi");
        return;
      }

      toast.success(`Xush kelibsiz, ${data.name}! 🛡️`);
      router.push("/admin");
      router.refresh();
    } catch {
      toast.error("Server bilan bog'lanishda xatolik");
    } finally {
      setLoading(false);
    }
  }

  const maxAttempts = 3;
  const attemptsLeft = maxAttempts - attempts;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: "radial-gradient(ellipse at top, #1a0a2e 0%, #0f0a1e 50%, #0a0a14 100%)",
      }}
    >
      {/* Glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(168,85,247,0.15) 0%, transparent 70%)" }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{
              background: "linear-gradient(135deg, #a855f7, #7c3aed)",
              boxShadow: "0 8px 32px rgba(124,58,237,0.4)",
            }}
          >
            <Shield size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Admin Panel</h1>
          <p style={{ color: "rgba(255,255,255,0.4)" }}>Faqat ruxsatga ega shaxslar uchun</p>
        </div>

        {/* Blocked state */}
        {blocked && (
          <div
            className="rounded-2xl p-5 mb-5 flex items-start gap-3"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}
          >
            <Clock size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-400 text-sm">Akkaunt vaqtincha bloklandi</p>
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                {countdown > 0
                  ? `${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, "0")} dan so'ng qayta urinib ko'ring`
                  : "Qayta urinishingiz mumkin"}
              </p>
            </div>
          </div>
        )}

        {/* Attempts warning */}
        {attempts > 0 && !blocked && (
          <div
            className="rounded-2xl p-4 mb-5 flex items-center gap-3"
            style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)" }}
          >
            <AlertTriangle size={17} className="text-yellow-500 flex-shrink-0" />
            <p className="text-sm text-yellow-400">
              {attemptsLeft} ta urinish qoldi. Shundan so'ng 15 daqiqa blok.
            </p>
          </div>
        )}

        {/* Form card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(168,85,247,0.2)",
            backdropFilter: "blur(20px)",
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-purple-200">
                Email manzil
              </label>
              <div className="relative">
                <Mail
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: "rgba(168,85,247,0.6)" }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  disabled={blocked || loading}
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all disabled:opacity-40"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1.5px solid rgba(168,85,247,0.25)",
                    color: "white",
                  }}
                  placeholder="admin@bilimmakon.uz"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-purple-200">Parol</label>
              <div className="relative">
                <Lock
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: "rgba(168,85,247,0.6)" }}
                />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={blocked || loading}
                  className="w-full pl-10 pr-12 py-3 rounded-xl text-sm outline-none transition-all disabled:opacity-40"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1.5px solid rgba(168,85,247,0.25)",
                    color: "white",
                  }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Admin Secret Key — optional extra layer */}
            <div>
              <button
                type="button"
                onClick={() => setNeedSecret(!needSecret)}
                className="text-xs flex items-center gap-1.5 mb-1.5"
                style={{ color: "rgba(168,85,247,0.7)" }}
              >
                <KeyRound size={13} />
                {needSecret ? "Maxfiy kalitni yashirish" : "+ Maxfiy kalit (ixtiyoriy qo'shimcha himoya)"}
              </button>
              {needSecret && (
                <div className="relative">
                  <KeyRound
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2"
                    style={{ color: "rgba(168,85,247,0.5)" }}
                  />
                  <input
                    type={showSecret ? "text" : "password"}
                    value={adminSecret}
                    onChange={e => setAdminSecret(e.target.value)}
                    disabled={blocked || loading}
                    className="w-full pl-10 pr-12 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1.5px solid rgba(168,85,247,0.2)",
                      color: "white",
                    }}
                    placeholder="Vercel da ADMIN_SECRET_KEY sifatida saqlangan kalit"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2"
                    style={{ color: "rgba(255,255,255,0.3)" }}
                  >
                    {showSecret ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || blocked}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed mt-2"
              style={{
                background: "linear-gradient(135deg, #a855f7, #7c3aed)",
                boxShadow: blocked ? "none" : "0 4px 20px rgba(124,58,237,0.4)",
              }}
            >
              {loading ? (
                <><Loader2 size={17} className="animate-spin" />Tekshirilmoqda...</>
              ) : blocked ? (
                <><Clock size={17} />{countdown > 0 ? `${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, "0")}` : "Bloklangan"}</>
              ) : (
                <><Shield size={17} />Admin sifatida kirish</>
              )}
            </button>
          </form>
        </div>

        {/* Security notice */}
        <div
          className="rounded-xl p-4 mt-4 flex items-start gap-2.5"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <Shield size={14} className="flex-shrink-0 mt-0.5" style={{ color: "rgba(168,85,247,0.5)" }} />
          <div className="text-xs space-y-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
            <p>• {maxAttempts} marta noto'g'ri urinish → 15 daqiqa blok</p>
            <p>• Barcha kirishlar qayd etiladi (IP, vaqt)</p>
            <p>• Faqat admin rolidagi hisob kira oladi</p>
          </div>
        </div>

        <div className="text-center mt-5">
          <Link
            href="/login"
            className="text-xs transition-colors hover:opacity-80"
            style={{ color: "rgba(255,255,255,0.25)" }}
          >
            ← Oddiy foydalanuvchi kirishi
          </Link>
        </div>
      </div>
    </div>
  );
}
