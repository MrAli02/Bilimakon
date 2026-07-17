"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, BookOpen, Edit2, Trash2, Eye, EyeOff, Loader2, X, Layers } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

interface Course {
  id: string; title: string; description: string;
  subject: string; is_published: boolean; order_index: number;
  modules?: { id: string }[];
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", subject: "Informatika", order_index: 1 });
  const supabase = createClient();

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("courses").select("*, modules(id)").order("order_index");
    setCourses(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  async function handleSave() {
    if (!form.title.trim()) { toast.error("Kurs nomini kiriting"); return; }
    setSaving(true);
    try {
      if (editCourse) {
        const { error } = await supabase.from("courses").update({
          title: form.title, description: form.description,
          subject: form.subject, order_index: form.order_index,
        }).eq("id", editCourse.id);
        if (error) throw error;
        toast.success("Kurs yangilandi!");
      } else {
        const slug = form.title.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "") + "-" + Date.now();
        const { error } = await supabase.from("courses").insert({
          title: form.title, description: form.description,
          subject: form.subject, order_index: form.order_index, slug,
        });
        if (error) throw error;
        toast.success("Kurs qo'shildi!");
      }
      resetForm(); fetchCourses();
    } catch (e: any) { toast.error(e.message ?? "Xatolik"); }
    finally { setSaving(false); }
  }

  async function togglePublish(course: Course) {
    await supabase.from("courses").update({ is_published: !course.is_published }).eq("id", course.id);
    toast.success(course.is_published ? "Yashirildi" : "Nashr qilindi");
    fetchCourses();
  }

  async function deleteCourse(id: string) {
    if (!confirm("Kursni o'chirishni tasdiqlaysizmi?")) return;
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (!error) { toast.success("O'chirildi"); fetchCourses(); }
    else toast.error("O'chirib bo'lmadi");
  }

  function startEdit(course: Course) {
    setEditCourse(course);
    setForm({ title: course.title, description: course.description, subject: course.subject, order_index: course.order_index });
    setShowForm(true);
  }

  function resetForm() {
    setShowForm(false); setEditCourse(null);
    setForm({ title: "", description: "", subject: "Informatika", order_index: 1 });
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>Kurslar</h1>
          <p style={{ color: "var(--text-secondary)" }}>Kurslarni boshqarish</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary">
          <Plus size={18} /> Kurs qo&apos;shish
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-lg rounded-2xl p-6 shadow-xl" style={{ background: "var(--surface)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                {editCourse ? "Kursni tahrirlash" : "Yangi kurs"}
              </h2>
              <button onClick={resetForm} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-secondary)]"
                style={{ color: "var(--text-secondary)" }}><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>Kurs nomi *</label>
                <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Masalan: Informatika Asoslari" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>Tavsif</label>
                <textarea className="input resize-none" rows={3} value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Kurs haqida..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>Fan</label>
                  <select className="input" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}>
                    {["Informatika","Matematika","Fizika","Kimyo","Biologiya","Ona tili","Tarix"].map(s => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>Tartib</label>
                  <input type="number" className="input" min={1} value={form.order_index}
                    onChange={e => setForm({ ...form, order_index: Number(e.target.value) })} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
                {saving && <Loader2 size={16} className="animate-spin" />}
                {editCourse ? "Saqlash" : "Qo'shish"}
              </button>
              <button onClick={resetForm} className="btn-secondary flex-1">Bekor</button>
            </div>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="p-5 border-b" style={{ borderColor: "var(--border)" }}>
          <span className="font-bold" style={{ color: "var(--text-primary)" }}>Barcha kurslar ({courses.length})</span>
        </div>
        {loading ? (
          <div className="p-8 flex justify-center"><Loader2 size={28} className="animate-spin" style={{ color: "var(--text-tertiary)" }} /></div>
        ) : courses.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen size={36} className="mx-auto mb-3" style={{ color: "var(--text-tertiary)" }} />
            <p style={{ color: "var(--text-secondary)" }}>Hali kurs yo&apos;q</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {courses.map(course => (
              <div key={course.id} className="flex items-center gap-4 p-4 hover:bg-[var(--bg-secondary)] transition-colors">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(51,102,255,0.1)" }}>
                  <BookOpen size={19} style={{ color: "#3366ff" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{course.title}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                    {course.subject} · {course.modules?.length ?? 0} modul · Tartib: {course.order_index}
                  </div>
                </div>
                <span className={`badge ${course.is_published ? "badge-green" : "badge-yellow"}`}>
                  {course.is_published ? "Nashr" : "Yashirin"}
                </span>
                <div className="flex items-center gap-1">
                  <Link href={`/admin/courses/${course.id}/modules`}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-tertiary)] transition-colors"
                    title="Modullarni boshqarish" style={{ color: "#8b5cf6" }}>
                    <Layers size={15} />
                  </Link>
                  <button onClick={() => togglePublish(course)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-tertiary)] transition-colors"
                    style={{ color: "var(--text-secondary)" }}>
                    {course.is_published ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                  <button onClick={() => startEdit(course)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-tertiary)] transition-colors"
                    style={{ color: "var(--text-secondary)" }}>
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => deleteCourse(course.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-950 text-red-500">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
