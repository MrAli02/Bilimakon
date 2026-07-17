"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Mail, Lock, User, Phone, Send, CheckCircle, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

type Step = "form" | "done";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("form");
  const [savedEmail, setSavedEmail] = useState("");
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", password: "", confirm: "" });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const upd = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name.trim()) { toast.error("Ism kiriting"); return; }
    if (form.password !== form.confirm) { toast.error("Parollar mos kelmadi"); return; }
    if (form.password.length < 6) { toast.error("Parol kamida 6 ta belgi bo'lishi kerak"); return; }
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: form.email, password: form.password,
        options: { data: { full_name: form.full_name, phone: form.phone } },
      });
      if (error) {
        toast.error(error.message.includes("already registered") ? "Bu email allaqachon ro'yxatdan o'tgan" : error.message);
        return;
      }
      if (data.user) {
        await supabase.from("profiles").upsert({
          id: data.user.id, email: form.email,
          full_name: form.full_name, phone: form.phone || null,
          role: "teacher", is_blocked: false,
        });
        setSavedEmail(form.email);
        setStep("done");
      }
    } catch { toast.error("Xatolik yuz berdi"); }
    finally { setLoading(false); }
  }

  const ADMIN_TG = process.env.NEXT_PUBLIC_ADMIN_TELEGRAM ?? "bilimmakon_admin";
  const tgLink = `https://t.me/${ADMIN_TG}?text=${encodeURIComponent(`Assalomu alaykum! BilimMakonga ro'yxatdan o'tdim.\nEmail: ${savedEmail}\nKirish kalitini bera olasizmi?`)}`;

  if (step === "done") return (
    <div>
      <div className="text-center mb-7">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(16,185,129,0.1)" }}>
          <CheckCircle size={32} className="text-green-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Hisob yaratildi!</h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Platformaga kirish uchun admindan kirish kaliti oling.</p>
      </div>
      <div className="space-y-3 mb-6">
        {[
          { n:1, t:`Quyidagi tugma orqali adminga yozing`, done:true },
          { n:2, t:`Email manzilingizni yuboring: ${savedEmail}`, done:true },
          { n:3, t:"Admin sizga kalit yuboradi (XXXX-XXXX-XXXX)", done:false },
          { n:4, t:"Kalitni /activate sahifasiga kiritib platformaga kiring", done:false },
        ].map(s => (
          <div key={s.n} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "var(--bg-secondary)" }}>
            <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ background: s.done ? "linear-gradient(135deg,#a855f7,#7c3aed)" : "var(--bg-tertiary)", color: s.done ? "white" : "var(--text-tertiary)" }}>
              {s.n}
            </span>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{s.t}</p>
          </div>
        ))}
      </div>
      <a href={tgLink} target="_blank" rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-sm text-white mb-3 transition-all hover:scale-[1.02]"
        style={{ background: "linear-gradient(135deg,#0088cc,#006aab)" }}>
        <Send size={17} /> Adminga Telegram orqali yozish
      </a>
      <button onClick={() => router.push("/activate")}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl font-semibold text-sm transition-all hover:scale-[1.02]"
        style={{ background: "rgba(168,85,247,0.08)", color: "#a855f7", border: "1.5px solid rgba(168,85,247,0.25)" }}>
        Kalitim bor — faollashtirish <ArrowRight size={15} />
      </button>
    </div>
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Ro&apos;yxatdan o&apos;tish</h1>
        <p style={{ color: "var(--text-secondary)" }}>Bepul hisob yarating</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>To&apos;liq ism *</label>
          <div className="relative">
            <User size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
            <input type="text" value={form.full_name} onChange={upd("full_name")} className="input pl-10" placeholder="Ismi Familiya" required />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>Email *</label>
          <div className="relative">
            <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
            <input type="email" value={form.email} onChange={upd("email")} className="input pl-10" placeholder="email@example.com" required />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>Telefon</label>
          <div className="relative">
            <Phone size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
            <input type="tel" value={form.phone} onChange={upd("phone")} className="input pl-10" placeholder="+998 90 123 45 67" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>Parol *</label>
          <div className="relative">
            <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
            <input type={show ? "text" : "password"} value={form.password} onChange={upd("password")} className="input pl-10 pr-12" placeholder="Kamida 6 ta belgi" required />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }}>
              {show ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>Parolni tasdiqlang *</label>
          <div className="relative">
            <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
            <input type={show ? "text" : "password"} value={form.confirm} onChange={upd("confirm")} className="input pl-10" placeholder="Qayta kiriting" required />
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
          {loading ? <><Loader2 size={17} className="animate-spin" />Yuklanmoqda...</> : "Ro'yxatdan o'tish"}
        </button>
      </form>
      <p className="text-center mt-5 text-sm" style={{ color: "var(--text-secondary)" }}>
        Hisobingiz bormi?{" "}
        <Link href="/login" className="font-semibold" style={{ color: "#a855f7" }}>Kirish</Link>
      </p>
    </div>
  );
}
