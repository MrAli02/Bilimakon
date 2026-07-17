"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, Mail, Lock, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("blocked") === "1") {
      toast.error("❌ Akkauntingiz bloklangan. Admin bilan bog'laning.");
    }
    if (searchParams.get("need_key") === "1") {
      toast("Kirish kalitingizni faollashtiring", { icon: "🔑" });
    }
  }, [searchParams]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.user) { toast.error("Email yoki parol noto'g'ri"); return; }

      const { data: profile } = await supabase
        .from("profiles").select("role, is_blocked, access_key_id").eq("id", data.user.id).single();

      if (profile?.role === "admin") {
        await supabase.auth.signOut();
        toast.error("Admin uchun maxsus kirish sahifasidan foydalaning.");
        router.push("/admin-login");
        return;
      }
      if (profile?.is_blocked) {
        await supabase.auth.signOut();
        toast.error("❌ Akkauntingiz bloklangan. Admin bilan bog'laning.");
        return;
      }
      if (!profile?.access_key_id) {
        router.push("/activate");
        return;
      }

      const fp = await getFingerprint();
      const res = await fetch("/api/auth/device", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fingerprint: fp, deviceInfo: navigator.userAgent }),
      });
      const check = await res.json();
      if (!check.allowed) {
        await supabase.auth.signOut();
        toast.error("❌ Qurilmalar limiti oshildi. Akkaunt bloklandi. Admin bilan bog'laning.");
        return;
      }

      await supabase.from("profiles").update({ last_login: new Date().toISOString() }).eq("id", data.user.id);
      toast.success("Xush kelibsiz!");
      router.push("/dashboard");
      router.refresh();
    } catch { toast.error("Kutilmagan xatolik"); }
    finally { setLoading(false); }
  }

  async function getFingerprint(): Promise<string> {
    const raw = [navigator.userAgent, navigator.language, screen.width + "x" + screen.height, navigator.platform].join("|");
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Kirish</h1>
        <p style={{ color: "var(--text-secondary)" }}>Hisobingizga kiring</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>Email</label>
          <div className="relative">
            <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="input pl-10" placeholder="email@example.com" required autoComplete="email" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>Parol</label>
          <div className="relative">
            <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
            <input type={show ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
              className="input pl-10 pr-12" placeholder="••••••••" required autoComplete="current-password" />
            <button type="button" onClick={() => setShow(!show)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }}>
              {show ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
          {loading ? <><Loader2 size={17} className="animate-spin" />Kirilmoqda...</> : "Kirish"}
        </button>
      </form>

      <div className="mt-5 p-4 rounded-xl flex gap-3"
        style={{ background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.15)" }}>
        <AlertCircle size={16} className="flex-shrink-0 mt-0.5" style={{ color: "#a855f7" }} />
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
          Birinchi marta kirayapsizmi? Avval{" "}
          <Link href="/register" className="font-bold underline" style={{ color: "#a855f7" }}>ro&apos;yxatdan o&apos;ting</Link>
          , keyin admindan kalit oling va{" "}
          <Link href="/activate" className="font-bold underline" style={{ color: "#a855f7" }}>faollashtiring</Link>.
        </p>
      </div>

      <p className="text-center mt-5 text-sm" style={{ color: "var(--text-secondary)" }}>
        Hisob yo&apos;qmi?{" "}
        <Link href="/register" className="font-semibold" style={{ color: "#a855f7" }}>Ro&apos;yxatdan o&apos;tish</Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center py-8"><Loader2 size={28} className="animate-spin mx-auto" style={{ color: "#a855f7" }} /></div>}>
      <LoginForm />
    </Suspense>
  );
}
