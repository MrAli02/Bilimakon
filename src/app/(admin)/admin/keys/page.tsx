"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Key, Plus, Copy, RefreshCw, Trash2, CheckCircle,
  Clock, XCircle, Loader2, X, Search, Smartphone, User, CalendarClock, StickyNote, Pencil
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

interface AccessKey {
  id: string;
  key: string;
  note?: string;
  max_devices: number;
  used_count: number;
  is_active: boolean;
  expires_at?: string;
  created_at: string;
  used_at?: string;
  used_by_profile?: { full_name: string; email: string } | null;
}

function generateKey(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const seg = () => Array(4).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `${seg()}-${seg()}-${seg()}`;
}

export default function AdminKeysPage() {
  const [keys, setKeys] = useState<AccessKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "used" | "expired">("all");
  const [form, setForm] = useState({
    key: generateKey(),
    note: "",
    max_devices: 1,
    expires_at: "",
    count: 1,
  });

  // Tahrirlash uchun alohida holat
  const [editingKey, setEditingKey] = useState<AccessKey | null>(null);
  const [editForm, setEditForm] = useState({ note: "", max_devices: 1, expires_at: "", is_active: true });
  const [editSaving, setEditSaving] = useState(false);

  const supabase = createClient();

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("access_keys")
      .select("*, used_by_profile:profiles!access_keys_used_by_fkey(full_name, email)")
      .order("created_at", { ascending: false });
    setKeys(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  const filtered = keys.filter(k => {
    const q = search.toLowerCase();
    const matchSearch = !q || k.key.toLowerCase().includes(q) || k.note?.toLowerCase().includes(q);
    const isExpired = k.expires_at && new Date(k.expires_at) < new Date();
    const matchFilter =
      filterStatus === "all" ? true :
      filterStatus === "active" ? k.is_active && !isExpired :
      filterStatus === "used" ? !k.is_active && k.used_by_profile :
      filterStatus === "expired" ? !!isExpired : true;
    return matchSearch && matchFilter;
  });

  async function handleSave() {
    if (!form.key.trim()) { toast.error("Kalit bo'sh bo'lishi mumkin emas"); return; }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const count = Math.min(form.count, 50);
      const inserts = Array(count).fill(0).map((_, i) => ({
        key: i === 0 ? form.key : generateKey(),
        note: form.note || null,
        max_devices: form.max_devices,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
        created_by: user?.id,
        is_active: true,
      }));

      const { error } = await supabase.from("access_keys").insert(inserts);
      if (error) throw error;
      toast.success(`${count} ta kalit yaratildi!`);
      setShowForm(false);
      setForm({ key: generateKey(), note: "", max_devices: 1, expires_at: "", count: 1 });
      fetchKeys();
    } catch (e: any) {
      toast.error(e.message ?? "Xatolik");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(k: AccessKey) {
    setEditingKey(k);
    setEditForm({
      note: k.note ?? "",
      max_devices: k.max_devices,
      expires_at: k.expires_at ? k.expires_at.split("T")[0] : "",
      is_active: k.is_active,
    });
  }

  async function saveEdit() {
    if (!editingKey) return;
    setEditSaving(true);
    try {
      const { error } = await supabase.from("access_keys").update({
        note: editForm.note || null,
        max_devices: editForm.max_devices,
        expires_at: editForm.expires_at ? new Date(editForm.expires_at).toISOString() : null,
        is_active: editForm.is_active,
      }).eq("id", editingKey.id);
      if (error) throw error;
      toast.success("Kalit yangilandi!");
      setEditingKey(null);
      fetchKeys();
    } catch (e: any) {
      toast.error(e.message ?? "Xatolik");
    } finally {
      setEditSaving(false);
    }
  }

  async function deactivateKey(id: string) {
    if (!confirm("Kalitni o'chirishni tasdiqlaysizmi?")) return;
    await supabase.from("access_keys").update({ is_active: false }).eq("id", id);
    toast.success("Kalit o'chirildi");
    fetchKeys();
  }

  async function deleteKey(id: string) {
    if (!confirm("Kalitni butunlay o'chirishni tasdiqlaysizmi?")) return;
    await supabase.from("access_keys").delete().eq("id", id);
    toast.success("O'chirildi");
    fetchKeys();
  }

  function copyKey(key: string) {
    navigator.clipboard.writeText(key);
    toast.success("Nusxalandi!");
  }

  const activeCount = keys.filter(k => k.is_active && (!k.expires_at || new Date(k.expires_at) > new Date())).length;
  const usedCount = keys.filter(k => !k.is_active && k.used_by_profile).length;

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>Kirish Kalitlari</h1>
          <p style={{ color: "var(--text-secondary)" }}>Bir martalik kirish kalitlarini boshqarish</p>
        </div>
        <button onClick={() => { setForm(f => ({ ...f, key: generateKey() })); setShowForm(true); }}
          className="btn-primary">
          <Plus size={18} /> Kalit yaratish
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Jami kalitlar", value: keys.length, color: "rgba(168,85,247,0.1)", ic: "#a855f7" },
          { label: "Faol kalitlar", value: activeCount, color: "rgba(16,185,129,0.1)", ic: "#10b981" },
          { label: "Ishlatilgan", value: usedCount, color: "rgba(245,158,11,0.1)", ic: "#f59e0b" },
        ].map(s => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.color }}>
              <Key size={18} style={{ color: s.ic }} />
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{s.value}</div>
              <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
          <input className="input pl-9 w-full" placeholder="Kalit yoki izoh qidirish..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["all","active","used","expired"] as const).map(f => (
            <button key={f} onClick={() => setFilterStatus(f)}
              className="px-3 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: filterStatus === f ? "linear-gradient(135deg,#a855f7,#7c3aed)" : "var(--bg-secondary)",
                color: filterStatus === f ? "white" : "var(--text-secondary)",
              }}>
              {f === "all" ? "Barchasi" : f === "active" ? "Faol" : f === "used" ? "Ishlatilgan" : "Muddati o'tgan"}
            </button>
          ))}
        </div>
      </div>

      {/* Keys list */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
          <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
            {filtered.length} ta kalit
          </span>
        </div>
        {loading ? (
          <div className="p-8 flex justify-center"><Loader2 size={28} className="animate-spin" style={{ color: "var(--text-tertiary)" }} /></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Key size={36} className="mx-auto mb-3" style={{ color: "var(--text-tertiary)" }} />
            <p style={{ color: "var(--text-secondary)" }}>Kalitlar yo&apos;q</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {filtered.map(k => {
              const isExpired = k.expires_at && new Date(k.expires_at) < new Date();
              const status = isExpired ? "expired" : !k.is_active ? "used" : "active";
              return (
                <div key={k.id} className="p-4 hover:bg-[var(--bg-secondary)] transition-colors">
                  {/* Top meta row — holat va yaratilgan sana birinchi ko'rinadi */}
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`badge text-xs flex items-center gap-1 ${
                        status === "active" ? "badge-green" : status === "used" ? "badge-red" : "badge-yellow"
                      }`}>
                        {status === "active" ? <CheckCircle size={11} /> : status === "used" ? <XCircle size={11} /> : <Clock size={11} />}
                        {status === "active" ? "Faol" : status === "used" ? "Ishlatilgan" : "Muddati o'tgan"}
                      </span>
                      <span className="text-xs px-2.5 py-1 rounded-lg font-medium flex items-center gap-1"
                        style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}>
                        <Smartphone size={11} /> Max {k.max_devices} qurilma
                      </span>
                      {k.expires_at && (
                        <span className="text-xs px-2.5 py-1 rounded-lg font-medium flex items-center gap-1"
                          style={isExpired
                            ? { background: "rgba(239,68,68,0.1)", color: "#ef4444" }
                            : { background: "rgba(59,130,246,0.1)", color: "#3b82f6" }}>
                          <CalendarClock size={11} /> {new Date(k.expires_at).toLocaleDateString("uz-UZ")}
                        </span>
                      )}
                    </div>
                    <span className="text-xs flex-shrink-0" style={{ color: "var(--text-tertiary)" }}>
                      {new Date(k.created_at).toLocaleDateString("uz-UZ")}
                    </span>
                  </div>

                  {/* Kalit kodi — eng ko'zga tashlanadigan qism */}
                  <div className="flex items-center gap-2 mb-2">
                    <code className="font-mono font-bold text-lg tracking-wider"
                      style={{ color: status === "active" ? "#a855f7" : "var(--text-tertiary)" }}>
                      {k.key}
                    </code>
                    <button onClick={() => copyKey(k.key)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--bg-tertiary)] transition-colors flex-shrink-0"
                      style={{ color: "var(--text-tertiary)" }}>
                      <Copy size={13} />
                    </button>
                  </div>

                  {/* Kim uchun / izoh — pastda, ikkinchi darajali ma'lumot */}
                  {(k.note || k.used_by_profile) && (
                    <div className="flex flex-wrap items-center gap-3 text-xs mb-3" style={{ color: "var(--text-secondary)" }}>
                      {k.note && (
                        <span className="flex items-center gap-1.5">
                          <StickyNote size={12} style={{ color: "var(--text-tertiary)" }} /> {k.note}
                        </span>
                      )}
                      {k.used_by_profile && (
                        <span className="flex items-center gap-1.5 font-medium" style={{ color: "#3b82f6" }}>
                          <User size={12} /> {(k.used_by_profile as any)?.full_name ?? "Foydalanuvchi"}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => startEdit(k)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[var(--bg-tertiary)] transition-colors"
                      style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                      <Pencil size={13} /> Tahrirlash
                    </button>
                    {status === "active" && (
                      <button onClick={() => deactivateKey(k.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-50 transition-colors text-red-500"
                        style={{ border: "1px solid rgba(239,68,68,0.25)" }}>
                        <XCircle size={13} /> O'chirish
                      </button>
                    )}
                    <button onClick={() => deleteKey(k.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-50 transition-colors text-red-600"
                      style={{ border: "1px solid rgba(239,68,68,0.25)" }}>
                      <Trash2 size={13} /> Butunlay o'chirish
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="w-full max-w-md rounded-2xl p-6 shadow-xl" style={{ background: "var(--surface)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Yangi kalit yaratish</h2>
              <button onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-secondary)]"
                style={{ color: "var(--text-secondary)" }}><X size={18} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>
                  Kalit
                </label>
                <div className="flex gap-2">
                  <input className="input flex-1 font-mono text-center tracking-widest font-bold"
                    value={form.key} onChange={e => setForm({ ...form, key: e.target.value.toUpperCase() })}
                    style={{ color: "#a855f7" }} />
                  <button onClick={() => setForm(f => ({ ...f, key: generateKey() }))}
                    className="w-10 rounded-xl flex items-center justify-center hover:bg-[var(--bg-secondary)] transition-colors"
                    style={{ border: "1.5px solid var(--border)", color: "var(--text-secondary)" }}>
                    <RefreshCw size={16} />
                  </button>
                  <button onClick={() => copyKey(form.key)}
                    className="w-10 rounded-xl flex items-center justify-center hover:bg-[var(--bg-secondary)] transition-colors"
                    style={{ border: "1.5px solid var(--border)", color: "var(--text-secondary)" }}>
                    <Copy size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>
                    Nechta kalit
                  </label>
                  <input type="number" className="input" min={1} max={50} value={form.count}
                    onChange={e => setForm({ ...form, count: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>
                    Max qurilmalar
                  </label>
                  <select className="input" value={form.max_devices}
                    onChange={e => setForm({ ...form, max_devices: Number(e.target.value) })}>
                    <option value={1}>1 qurilma</option>
                    <option value={2}>2 qurilma</option>
                    <option value={3}>3 qurilma</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>
                  Amal qilish muddati (ixtiyoriy)
                </label>
                <input type="date" className="input" value={form.expires_at}
                  onChange={e => setForm({ ...form, expires_at: e.target.value })}
                  min={new Date().toISOString().split("T")[0]} />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>
                  Izoh (ixtiyoriy)
                </label>
                <input className="input" value={form.note}
                  onChange={e => setForm({ ...form, note: e.target.value })}
                  placeholder="Kim uchun, qaysi guruh..." />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
                {saving && <Loader2 size={16} className="animate-spin" />}
                {form.count > 1 ? `${form.count} ta kalit yaratish` : "Kalit yaratish"}
              </button>
              <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Bekor</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="w-full max-w-md rounded-2xl p-6 shadow-xl" style={{ background: "var(--surface)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Kalitni tahrirlash</h2>
              <button onClick={() => setEditingKey(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-secondary)]"
                style={{ color: "var(--text-secondary)" }}><X size={18} /></button>
            </div>

            <div className="mb-4 p-3 rounded-xl text-center" style={{ background: "var(--bg-secondary)" }}>
              <code className="font-mono font-bold text-lg tracking-wider" style={{ color: "#a855f7" }}>
                {editingKey.key}
              </code>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>
                  Max qurilmalar
                </label>
                <select className="input" value={editForm.max_devices}
                  onChange={e => setEditForm({ ...editForm, max_devices: Number(e.target.value) })}>
                  <option value={1}>1 qurilma</option>
                  <option value={2}>2 qurilma</option>
                  <option value={3}>3 qurilma</option>
                  <option value={5}>5 qurilma</option>
                  <option value={10}>10 qurilma</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>
                  Amal qilish muddati
                </label>
                <input type="date" className="input" value={editForm.expires_at}
                  onChange={e => setEditForm({ ...editForm, expires_at: e.target.value })} />
                <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>Bo'sh qoldirsangiz — muddatsiz bo'ladi</p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>
                  Izoh
                </label>
                <input className="input" value={editForm.note}
                  onChange={e => setEditForm({ ...editForm, note: e.target.value })}
                  placeholder="Kim uchun, qaysi guruh..." />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "var(--bg-secondary)" }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Faol holat</p>
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>O'chirilgan kalit login uchun ishlamaydi</p>
                </div>
                <button type="button" onClick={() => setEditForm(f => ({ ...f, is_active: !f.is_active }))}
                  className="w-12 h-7 rounded-full relative transition-all flex-shrink-0"
                  style={{ background: editForm.is_active ? "#10b981" : "var(--bg-tertiary)" }}>
                  <span className="absolute top-1 w-5 h-5 rounded-full bg-white transition-all"
                    style={{ left: editForm.is_active ? "26px" : "4px" }} />
                </button>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={saveEdit} disabled={editSaving} className="btn-primary flex-1">
                {editSaving && <Loader2 size={16} className="animate-spin" />}
                Saqlash
              </button>
              <button onClick={() => setEditingKey(null)} className="btn-secondary flex-1">Bekor</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
