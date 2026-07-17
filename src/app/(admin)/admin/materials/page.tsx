"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileText, Plus, Trash2, Eye, EyeOff, Loader2,
  X, Link as LinkIcon, BookOpen, Download
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

interface Material {
  id: string;
  title: string;
  type: "pdf" | "link" | "file";
  url: string;
  lesson_id?: string;
  course_id?: string;
  module_id?: string;
  is_published: boolean;
  order_index: number;
  created_at: string;
  lessons?: { title: string; modules?: { title: string; courses?: { title: string } } };
}

interface Course { id: string; title: string; }
interface Module { id: string; title: string; course_id: string; }
interface Lesson { id: string; title: string; module_id: string; }

export default function AdminMaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    type: "pdf" as "pdf" | "link" | "file",
    url: "",
    course_id: "",
    module_id: "",
    lesson_id: "",
    order_index: 1,
  });
  const supabase = createClient();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [{ data: m }, { data: c }, { data: mod }, { data: les }] = await Promise.all([
      supabase.from("materials")
        .select("*, lessons(title, modules(title, courses(title)))")
        .order("created_at", { ascending: false }),
      supabase.from("courses").select("id, title").order("order_index"),
      supabase.from("modules").select("id, title, course_id").order("order_index"),
      supabase.from("lessons").select("id, title, module_id").order("order_index"),
    ]);
    setMaterials(m ?? []);
    setCourses(c ?? []);
    setModules(mod ?? []);
    setLessons(les ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filteredModules = modules.filter(m => !form.course_id || m.course_id === form.course_id);
  const filteredLessons = lessons.filter(l => !form.module_id || l.module_id === form.module_id);

  async function handleSave() {
    if (!form.title.trim()) { toast.error("Sarlavha kiriting"); return; }
    if (!form.url.trim()) { toast.error("URL kiriting"); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from("materials").insert({
        title: form.title,
        type: form.type,
        url: form.url,
        course_id: form.course_id || null,
        module_id: form.module_id || null,
        lesson_id: form.lesson_id || null,
        order_index: form.order_index,
        is_published: true,
      });
      if (error) throw error;
      toast.success("Material qo'shildi!");
      resetForm();
      fetchAll();
    } catch (e: any) {
      toast.error(e.message ?? "Xatolik");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublish(mat: Material) {
    await supabase.from("materials").update({ is_published: !mat.is_published }).eq("id", mat.id);
    fetchAll();
  }

  async function deleteMaterial(id: string) {
    if (!confirm("Materialni o'chirishni tasdiqlaysizmi?")) return;
    await supabase.from("materials").delete().eq("id", id);
    toast.success("O'chirildi");
    fetchAll();
  }

  function resetForm() {
    setShowForm(false);
    setForm({ title: "", type: "pdf", url: "", course_id: "", module_id: "", lesson_id: "", order_index: 1 });
  }

  const typeIcon = (type: string) => {
    if (type === "pdf") return <FileText size={16} className="text-red-500" />;
    if (type === "link") return <LinkIcon size={16} className="text-blue-500" />;
    return <Download size={16} style={{ color: "var(--text-secondary)" }} />;
  };

  const typeLabel = (type: string) => type === "pdf" ? "PDF" : type === "link" ? "Link" : "Fayl";
  const typeColor = (type: string) => type === "pdf" ? "badge-red" : type === "link" ? "badge-blue" : "badge-yellow";

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>Materiallar</h1>
          <p style={{ color: "var(--text-secondary)" }}>PDF, elektron darsliklar va havolalar</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={18} /> Material qo&apos;shish
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Jami", value: materials.length, color: "rgba(168,85,247,0.1)", ic: "#a855f7" },
          { label: "PDF fayllar", value: materials.filter(m => m.type === "pdf").length, color: "rgba(239,68,68,0.1)", ic: "#ef4444" },
          { label: "Nashr qilingan", value: materials.filter(m => m.is_published).length, color: "rgba(16,185,129,0.1)", ic: "#10b981" },
        ].map(s => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.color }}>
              <FileText size={18} style={{ color: s.ic }} />
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{s.value}</div>
              <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Materials list */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
          <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
            {materials.length} ta material
          </span>
        </div>
        {loading ? (
          <div className="p-8 flex justify-center"><Loader2 size={28} className="animate-spin" style={{ color: "var(--text-tertiary)" }} /></div>
        ) : materials.length === 0 ? (
          <div className="p-12 text-center">
            <FileText size={36} className="mx-auto mb-3" style={{ color: "var(--text-tertiary)" }} />
            <p className="mb-4" style={{ color: "var(--text-secondary)" }}>Hali material yo&apos;q</p>
            <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
              <Plus size={16} /> Birinchi materialni qo&apos;shing
            </button>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {materials.map(mat => (
              <div key={mat.id} className="flex items-center gap-4 p-4 hover:bg-[var(--bg-secondary)] transition-colors">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: mat.type === "pdf" ? "rgba(239,68,68,0.08)" : mat.type === "link" ? "rgba(59,130,246,0.08)" : "var(--bg-tertiary)" }}>
                  {typeIcon(mat.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm mb-0.5" style={{ color: "var(--text-primary)" }}>
                    {mat.title}
                  </div>
                  <div className="text-xs flex items-center gap-2 flex-wrap" style={{ color: "var(--text-tertiary)" }}>
                    <span className={`badge ${typeColor(mat.type)}`}>{typeLabel(mat.type)}</span>
                    {mat.lessons?.modules?.courses?.title && (
                      <span className="flex items-center gap-1">
                        <BookOpen size={11} />{mat.lessons.modules.courses.title}
                      </span>
                    )}
                    {mat.lessons?.modules?.title && <span>→ {mat.lessons.modules.title}</span>}
                    {mat.lessons?.title && <span>→ {mat.lessons.title}</span>}
                  </div>
                  <a href={mat.url} target="_blank" rel="noopener noreferrer"
                    className="text-xs mt-0.5 hover:underline truncate block max-w-xs"
                    style={{ color: "#3366ff" }}>
                    {mat.url}
                  </a>
                </div>
                <span className={`badge ${mat.is_published ? "badge-green" : "badge-yellow"}`}>
                  {mat.is_published ? "Nashr" : "Yashirin"}
                </span>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => togglePublish(mat)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-tertiary)] transition-colors"
                    style={{ color: "var(--text-secondary)" }}>
                    {mat.is_published ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                  <button onClick={() => deleteMaterial(mat.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 text-red-500 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="w-full max-w-lg rounded-2xl p-6 shadow-xl my-8" style={{ background: "var(--surface)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Yangi material</h2>
              <button onClick={resetForm} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-secondary)]"
                style={{ color: "var(--text-secondary)" }}><X size={18} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>Sarlavha *</label>
                <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Masalan: 1-bob ma'ruzasi (PDF)" />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Turi</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { value: "pdf", label: "PDF", icon: FileText, color: "#ef4444" },
                    { value: "link", label: "Havola", icon: LinkIcon, color: "#3b82f6" },
                    { value: "file", label: "Fayl", icon: Download, color: "#a855f7" },
                  ] as const).map(t => (
                    <button key={t.value} type="button"
                      onClick={() => setForm({ ...form, type: t.value })}
                      className="flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all"
                      style={{
                        borderColor: form.type === t.value ? t.color : "var(--border)",
                        background: form.type === t.value ? `${t.color}10` : "var(--bg-secondary)",
                      }}>
                      <t.icon size={20} style={{ color: form.type === t.value ? t.color : "var(--text-tertiary)" }} />
                      <span className="text-xs font-semibold" style={{ color: form.type === t.value ? t.color : "var(--text-secondary)" }}>
                        {t.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>
                  {form.type === "pdf" ? "PDF URL (Google Drive, Cloudinary...)" : form.type === "link" ? "Havola URL" : "Fayl URL"} *
                </label>
                <input className="input" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })}
                  placeholder={form.type === "pdf" ? "https://drive.google.com/..." : "https://..."}
                  type="url" />
                {form.type === "pdf" && (
                  <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
                    💡 Google Drive: File → Share → Copy link (baham ko'rish havolasi)
                  </p>
                )}
              </div>

              {/* Kurs/Modul/Dars bog'lash */}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>
                  Kurs (ixtiyoriy)
                </label>
                <select className="input" value={form.course_id}
                  onChange={e => setForm({ ...form, course_id: e.target.value, module_id: "", lesson_id: "" })}>
                  <option value="">Kurs tanlang...</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>

              {form.course_id && (
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>
                    Modul (ixtiyoriy)
                  </label>
                  <select className="input" value={form.module_id}
                    onChange={e => setForm({ ...form, module_id: e.target.value, lesson_id: "" })}>
                    <option value="">Modul tanlang...</option>
                    {filteredModules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                  </select>
                </div>
              )}

              {form.module_id && (
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>
                    Dars (ixtiyoriy)
                  </label>
                  <select className="input" value={form.lesson_id}
                    onChange={e => setForm({ ...form, lesson_id: e.target.value })}>
                    <option value="">Dars tanlang...</option>
                    {filteredLessons.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>Tartib</label>
                <input type="number" className="input" min={1} value={form.order_index}
                  onChange={e => setForm({ ...form, order_index: Number(e.target.value) })} />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
                {saving && <Loader2 size={16} className="animate-spin" />}
                Material qo&apos;shish
              </button>
              <button onClick={resetForm} className="btn-secondary flex-1">Bekor</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
