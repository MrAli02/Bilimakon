"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, Settings, DollarSign, ToggleLeft, ToggleRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

interface Setting { key: string; value: string; }

const DEFAULT: Record<string, string> = {
  simulator_price: "50000",
  simulator_enabled: "true",
  simulator_questions_count: "50",
  simulator_duration_minutes: "90",
  simulator_passing_score: "70",
  platform_name: "BilimMakon",
  telegram_support_username: "",
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("settings").select("key, value");
      if (data) {
        const m = { ...DEFAULT };
        data.forEach((s: Setting) => { m[s.key] = s.value; });
        setSettings(m);
      }
      setLoading(false);
    }
    load();
  }, [supabase]);

  async function handleSave() {
    setSaving(true);
    try {
      const upserts = Object.entries(settings).map(([key, value]) => ({ key, value }));
      const { error } = await supabase.from("settings").upsert(upserts, { onConflict: "key" });
      if (error) throw error;
      toast.success("Sozlamalar saqlandi!");
    } catch (e: any) { toast.error(e.message ?? "Xatolik"); }
    finally { setSaving(false); }
  }

  const set = (key: string, val: string) => setSettings(s => ({ ...s, [key]: val }));
  const toggle = (key: string) => set(key, settings[key] === "true" ? "false" : "true");

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={32} className="animate-spin" style={{ color: "var(--text-tertiary)" }} />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>Sozlamalar</h1>
          <p style={{ color: "var(--text-secondary)" }}>Platforma konfiguratsiyasi</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
          Saqlash
        </button>
      </div>

      <div className="space-y-5">
        {/* Simulator */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(245,158,11,0.1)" }}>
              <Settings size={20} style={{ color: "#f59e0b" }} />
            </div>
            <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Simulyator sozlamalari</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: "var(--border)" }}>
              <div>
                <div className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Simulyatorni yoqish</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>O'chirilsa foydalanuvchilar kira olmaydi</div>
              </div>
              <button onClick={() => toggle("simulator_enabled")}
                style={{ color: settings.simulator_enabled === "true" ? "#a855f7" : "var(--text-tertiary)" }}>
                {settings.simulator_enabled === "true" ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>Narxi (UZS)</label>
                <div className="relative">
                  <DollarSign size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
                  <input type="number" className="input pl-8" value={settings.simulator_price}
                    onChange={e => set("simulator_price", e.target.value)} min={0} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>Savollar soni</label>
                <input type="number" className="input" value={settings.simulator_questions_count}
                  onChange={e => set("simulator_questions_count", e.target.value)} min={10} max={200} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>Vaqt (daqiqa)</label>
                <input type="number" className="input" value={settings.simulator_duration_minutes}
                  onChange={e => set("simulator_duration_minutes", e.target.value)} min={10} max={360} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>O'tish bali (%)</label>
                <input type="number" className="input" value={settings.simulator_passing_score}
                  onChange={e => set("simulator_passing_score", e.target.value)} min={1} max={100} />
              </div>
            </div>
          </div>
        </div>

        {/* Platform */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(168,85,247,0.1)" }}>
              <Settings size={20} style={{ color: "#a855f7" }} />
            </div>
            <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Platforma sozlamalari</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>Platforma nomi</label>
              <input className="input" value={settings.platform_name} onChange={e => set("platform_name", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>
                Telegram qo&apos;llab-quvvatlash (username, @ belgisisiz)
              </label>
              <input className="input" value={settings.telegram_support_username}
                onChange={e => set("telegram_support_username", e.target.value)}
                placeholder="bilimmakon_support" />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button onClick={handleSave} disabled={saving} className="btn-primary px-8">
            {saving ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
            Barcha sozlamalarni saqlash
          </button>
        </div>
      </div>
    </div>
  );
}
