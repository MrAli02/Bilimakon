"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Megaphone, Trash2, Send, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

interface Announcement { id: string; title: string; content: string; is_published: boolean; created_at: string; }

export default function AdminAnnouncementsPage() {
  const [list, setList] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", content: "", is_published: true });
  const supabase = createClient();

  const fetchList = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
    setList(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchList(); }, [fetchList]);

  async function handleSave() {
    if (!form.title.trim() || !form.content.trim()) { toast.error("Sarlavha va matnni kiriting"); return; }
    setSaving(true);
    try {
      await supabase.from("announcements").insert(form);
      toast.success("E'lon qo'shildi!");
      setShowForm(false);
      setForm({ title: "", content: "", is_published: true });
      fetchList();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  async function sendToTelegram(ann: Announcement) {
    setSending(ann.id);
    try {
      const res = await fetch("/api/admin/announce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: ann.title, content: ann.content }),
      });
      const data = await res.json();
      if (res.ok) toast.success(`Telegram ga yuborildi (${data.sent ?? 0} kishi)`);
      else toast.error("Yuborishda xatolik");
    } catch { toast.error("Xatolik"); }
    finally { setSending(null); }
  }

  async function deleteAnn(id: string) {
    if (!confirm("O'chirasizmi?")) return;
    await supabase.from("announcements").delete().eq("id", id);
    fetchList();
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>E&apos;lonlar</h1>
          <p style={{ color: "var(--text-secondary)" }}>Foydalanuvchilarga xabarlar</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={18} /> E&apos;lon qo&apos;shish
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="w-full max-w-lg rounded-2xl p-6 shadow-xl" style={{ background: "var(--surface)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Yangi e&apos;lon</h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-secondary)]"
                style={{ color: "var(--text-secondary)" }}><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>Sarlavha *</label>
                <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="E'lon sarlavhasi" autoFocus />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>Matn *</label>
                <textarea className="input resize-none" rows={4} value={form.content}
                  onChange={e => setForm({ ...form, content: e.target.value })} placeholder="E'lon matni..." />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_published}
                  onChange={e => setForm({ ...form, is_published: e.target.checked })}
                  className="w-4 h-4 rounded" />
                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Nashr qilish</span>
              </label>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
                {saving && <Loader2 size={16} className="animate-spin" />} Saqlash
              </button>
              <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Bekor</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={32} className="animate-spin" style={{ color: "var(--text-tertiary)" }} /></div>
      ) : list.length === 0 ? (
        <div className="card p-12 text-center">
          <Megaphone size={36} className="mx-auto mb-3" style={{ color: "var(--text-tertiary)" }} />
          <p style={{ color: "var(--text-secondary)" }}>Hali e&apos;lonlar yo&apos;q</p>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map(ann => (
            <div key={ann.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>{ann.title}</h3>
                    <span className={`badge ${ann.is_published ? "badge-green" : "badge-yellow"}`}>
                      {ann.is_published ? "Nashr" : "Yashirin"}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed mb-2" style={{ color: "var(--text-secondary)" }}>{ann.content}</p>
                  <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {new Date(ann.created_at).toLocaleString("uz-UZ")}
                  </span>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => sendToTelegram(ann)} disabled={sending === ann.id}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
                    style={{ background: "rgba(0,136,204,0.1)", color: "#0088cc" }}>
                    {sending === ann.id ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                    Telegram
                  </button>
                  <button onClick={() => deleteAnn(ann.id)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-red-50 text-red-500 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
