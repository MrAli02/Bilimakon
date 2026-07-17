"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Key, Loader2, CheckCircle, Send, BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import Link from "next/link";

export default function ActivatePage() {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const ADMIN_TG = process.env.NEXT_PUBLIC_ADMIN_TELEGRAM ?? "bilimmakon_admin";

  useEffect(() => {
    async function check() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles").select("access_key_id, email, is_blocked").eq("id", user.id).single();
      
      if (profile?.is_blocked) {
        await supabase.auth.signOut();
        router.push("/login?blocked=1");
        return;
      }
      if (profile?.access_key_id) {
        // Already activated
        router.push("/dashboard");
        return;
      }
      setUserEmail(profile?.email ?? user.email ?? "");
      setChecking(false);
    }
    check();
  }, [router]);

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault();
    const trimmedKey = key.trim().toUpperCase().replace(/\s/g, "");
    if (!trimmedKey) { toast.error("Kalitni kiriting"); return; }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      // Find key
      const { data: keyData, error: keyErr } = await supabase
        .from("access_keys")
        .select("*")
        .eq("key", trimmedKey)
        .eq("is_active", true)
        .single();

      if (keyErr || !keyData) {
        toast.error("Kalit topilmadi yoki allaqachon ishlatilgan");
        return;
      }

      // Check expiry
      if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
        toast.error("Kalitning amal qilish muddati tugagan");
        return;
      }

      // Check if used by another user
      if (keyData.used_by && keyData.used_by !== user.id) {
        toast.error("Bu kalit boshqa foydalanuvchi tomonidan ishlatilgan");
        return;
      }

      // Activate: mark key used
      await supabase.from("access_keys").update({
        used_by: user.id,
        used_count: (keyData.used_count ?? 0) + 1,
        used_at: new Date().toISOString(),
        is_active: false,
      }).eq("id", keyData.id);

      // Link key to profile
      await supabase.from("profiles").update({
        access_key_id: keyData.id,
        last_login: new Date().toISOString(),
      }).eq("id", user.id);

      // Register device session
      const fp = await getFingerprint();
      await supabase.from("user_sessions").insert({
        user_id: user.id,
        device_fingerprint: fp,
        device_info: navigator.userAgent.substring(0, 200),
        is_active: true,
      });

      toast.success("🎉 Kalit faollashtirildi! Xush kelibsiz!");
      router.push("/dashboard");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message ?? "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }

  async function getFingerprint(): Promise<string> {
    const raw = [navigator.userAgent, navigator.language, screen.width + "x" + screen.height, navigator.platform].join("|");
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
  }

  function formatKey(val: string) {
    const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const parts = clean.match(/.{1,4}/g) ?? [];
    return parts.slice(0, 3).join("-");
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <Loader2 size={32} className="animate-spin" style={{ color: "#a855f7" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: "linear-gradient(135deg, #fce7ff 0%, #ede9fe 100%)" }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "linear-gradient(135deg, #a855f7, #7c3aed)" }}>
            <BookOpen size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "#1a1a2e" }}>BilimMakon</h1>
        </div>

        <div className="rounded-2xl p-8 shadow-xl"
          style={{ background: "white", border: "1px solid rgba(168,85,247,0.15)" }}>
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(168,85,247,0.08)" }}>
              <Key size={28} style={{ color: "#a855f7" }} />
            </div>
            <h2 className="text-xl font-bold mb-1" style={{ color: "#1a1a2e" }}>Kirish kalitini kiriting</h2>
            <p className="text-sm" style={{ color: "#6b6b8f" }}>
              Admindan olgan bir martalik kalitingizni kiriting
            </p>
          </div>

          <form onSubmit={handleActivate} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "#1a1a2e" }}>
                Kirish kaliti
              </label>
              <input
                className="w-full px-4 py-4 rounded-xl text-center font-mono text-xl font-bold tracking-widest outline-none transition-all"
                style={{
                  background: "rgba(168,85,247,0.04)",
                  border: "2px solid rgba(168,85,247,0.3)",
                  color: "#a855f7",
                  letterSpacing: "0.15em",
                }}
                value={key}
                onChange={e => setKey(formatKey(e.target.value))}
                placeholder="XXXX-XXXX-XXXX"
                maxLength={14}
                autoFocus
                spellCheck={false}
                autoCapitalize="characters"
              />
              <p className="text-xs mt-1.5 text-center" style={{ color: "#9898bb" }}>
                Kalit: 12 ta belgi, 3 qismdan iborat
              </p>
            </div>

            <button type="submit" disabled={loading || key.replace(/-/g, "").length < 12}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #a855f7, #7c3aed)", boxShadow: "0 4px 16px rgba(124,58,237,0.3)" }}>
              {loading ? <Loader2 size={17} className="animate-spin" /> : <CheckCircle size={17} />}
              {loading ? "Tekshirilmoqda..." : "Kalitni faollashtirish"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            <span className="text-xs" style={{ color: "#9898bb" }}>Kalit yo&apos;qmi?</span>
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          </div>

          {/* Get key from admin */}
          <a href={`https://t.me/${ADMIN_TG}?text=${encodeURIComponent(`Assalomu alaykum! Kirish kalitini bera olasizmi?\nEmail: ${userEmail}`)}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02]"
            style={{ background: "rgba(0,136,204,0.08)", color: "#0088cc", border: "1.5px solid rgba(0,136,204,0.2)" }}>
            <Send size={16} />
            Admindan kalit so&apos;rash (Telegram)
          </a>
        </div>

        <p className="text-center mt-5 text-sm" style={{ color: "#9898bb" }}>
          <Link href="/login" className="hover:underline" style={{ color: "#a855f7" }}>
            ← Kirishga qaytish
          </Link>
        </p>
      </div>
    </div>
  );
}
