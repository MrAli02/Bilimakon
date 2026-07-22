"use client";

import { useState, useEffect } from "react";
import { User, Mail, Phone, Save, Loader2, Lock, Eye, EyeOff, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
const SUBJECTS = ["Informatika","Matematika","Fizika","Kimyo","Biologiya","Ona tili","Tarix","Ingliz tili"];
export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState({ full_name: "", phone: "", subject: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [savingPass, setSavingPass] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (p) { setProfile(p); setForm({ full_name: p.full_name ?? "", phone: p.phone ?? "", subject: p.subject ?? "" }); }
      setLoading(false);
    }
    load();
  }, [supabase]);

  async function saveProfile() {
    if (!form.full_name.trim()) { toast.error("Ism kiriting"); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles")
        .update({ full_name: form.full_name, phone: form.phone || null, subject: form.subject || null })
        .eq("id", profile.id);
      if (error) throw error;
      toast.success("Profil yangilandi!");
      setProfile((p: any) => ({ ...p, ...form }));
    } catch (e: any) { toast.error(e.message ?? "Xatolik"); }
    finally { setSaving(false); }
  }

  async function changePassword() {
    if (!passwords.current) { toast.error("Joriy parolni kiriting"); return; }
    if (passwords.new.length < 6) { toast.error("Yangi parol kamida 6 ta belgi"); return; }
    if (passwords.new !== passwords.confirm) { toast.error("Parollar mos kelmadi"); return; }
    setSavingPass(true);
    try {
      // Verify current password by re-signing in
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: passwords.current,
      });
      if (signInErr) { toast.error("Joriy parol noto'g'ri"); return; }

      const { error } = await supabase.auth.updateUser({ password: passwords.new });
      if (error) throw error;
      toast.success("Parol muvaffaqiyatli o'zgartirildi!");
      setPasswords({ current: "", new: "", confirm: "" });
    } catch (e: any) { toast.error(e.message ?? "Xatolik"); }
    finally { setSavingPass(false); }
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (loading) return (
    <div className="flex justify-center py-16">
      <Loader2 size={32} className="animate-spin" style={{ color: "#a855f7" }} />
    </div>
  );

  return (
    <div className="max-w-xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>Profil</h1>
        <p style={{ color: "var(--text-secondary)" }}>Shaxsiy ma'lumotlaringiz</p>
      </div>

      {/* Avatar */}
      <div className="card p-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl text-white flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#a855f7,#ec4899)" }}>
          {profile?.full_name?.[0] ?? "U"}
        </div>
        <div>
          <p className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>{profile?.full_name}</p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{profile?.email}</p>
          <span className="badge-blue mt-1 inline-block">O'qituvchi</span>
        </div>
      </div>

      {/* Edit profile */}
      <div className="card p-5">
        <h2 className="font-bold mb-4" style={{ color: "var(--text-primary)" }}>Ma'lumotlarni tahrirlash</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>To'liq ism</label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
              <input className="input pl-10" value={form.full_name}
                onChange={e => setForm({ ...form, full_name: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
              <input className="input pl-10 opacity-60 cursor-not-allowed" value={profile?.email ?? ""} disabled />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>Telefon</label>
            <div className="relative">
              <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
              <input className="input pl-10" value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="+998 90 123 45 67" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>Mutaxassislik fani</label>
            <select className="input" value={form.subject}
              onChange={e => setForm({ ...form, subject: e.target.value })}>
              <option value="">— Tanlanmagan —</option>
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <button onClick={saveProfile} disabled={saving} className="btn-primary mt-4">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Saqlash
        </button>
      </div>

      {/* Change password */}
      <div className="card p-5">
        <h2 className="font-bold mb-4" style={{ color: "var(--text-primary)" }}>Parolni almashtirish</h2>
        <div className="space-y-3">
          {[
            { key: "current", label: "Joriy parol", placeholder: "Joriy parolni kiriting" },
            { key: "new", label: "Yangi parol", placeholder: "Kamida 6 ta belgi" },
            { key: "confirm", label: "Yangi parolni tasdiqlang", placeholder: "Qayta kiriting" },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>{f.label}</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
                <input type={showPass ? "text" : "password"} className="input pl-10 pr-10"
                  value={passwords[f.key as keyof typeof passwords]}
                  onChange={e => setPasswords({ ...passwords, [f.key]: e.target.value })}
                  placeholder={f.placeholder} />
                {f.key === "current" && (
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--text-tertiary)" }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <button onClick={changePassword} disabled={savingPass} className="btn-secondary mt-4">
          {savingPass ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
          Parolni o'zgartirish
        </button>
      </div>

      {/* Logout */}
      <div className="card p-5">
        <h2 className="font-bold mb-3" style={{ color: "var(--text-primary)" }}>Hisobdan chiqish</h2>
        <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
          Barcha qurilmalardagi sessiyalardan chiqasiz.
        </p>
        <button onClick={logout}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-500 transition-all hover:bg-red-50 dark:hover:bg-red-950">
          <LogOut size={16} /> Chiqish
        </button>
      </div>
    </div>
  );
}
