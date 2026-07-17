"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Plus, ChevronLeft, BookOpen, Edit2, Trash2,
  Eye, EyeOff, Loader2, X,
  Play, Youtube, GripVertical, ChevronDown, ChevronUp
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

interface Lesson {
  id: string; title: string; youtube_video_id?: string;
  duration_seconds?: number; order_index: number; is_published: boolean;
}
interface Module {
  id: string; title: string; description?: string;
  order_index: number; passing_score: number; is_published: boolean;
  lessons?: Lesson[];
}
interface Course { id: string; title: string; subject: string; }

export default function AdminCourseModulesPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  // Module form
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [editModule, setEditModule] = useState<Module | null>(null);
  const [savingModule, setSavingModule] = useState(false);
  const [mForm, setMForm] = useState({ title: "", description: "", order_index: 1, passing_score: 70 });

  // Lesson form
  const [showLessonForm, setShowLessonForm] = useState<string | null>(null); // moduleId
  const [editLesson, setEditLesson] = useState<Lesson | null>(null);
  const [savingLesson, setSavingLesson] = useState(false);
  const [lForm, setLForm] = useState({ title: "", description: "", youtube_video_id: "", duration_seconds: "", order_index: 1 });

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: c }, { data: m }] = await Promise.all([
      supabase.from("courses").select("id,title,subject").eq("id", courseId).single(),
      supabase.from("modules").select("*, lessons(*)").eq("course_id", courseId).order("order_index"),
    ]);
    setCourse(c);
    const sorted = (m ?? []).map((mod: Module) => ({
      ...mod,
      lessons: [...(mod.lessons ?? [])].sort((a, b) => a.order_index - b.order_index),
    }));
    setModules(sorted);
    setLoading(false);
  }, [courseId, supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Module CRUD ──
  async function saveModule() {
    if (!mForm.title.trim()) { toast.error("Modul nomini kiriting"); return; }
    setSavingModule(true);
    try {
      if (editModule) {
        await supabase.from("modules").update({ ...mForm }).eq("id", editModule.id);
        toast.success("Modul yangilandi!");
      } else {
        await supabase.from("modules").insert({ ...mForm, course_id: courseId });
        toast.success("Modul qo'shildi!");
      }
      resetModuleForm(); fetchData();
    } catch (e: any) { toast.error(e.message); }
    finally { setSavingModule(false); }
  }

  function resetModuleForm() {
    setShowModuleForm(false); setEditModule(null);
    setMForm({ title: "", description: "", order_index: modules.length + 1, passing_score: 70 });
  }

  async function deleteModule(id: string) {
    if (!confirm("Modul va barcha darslarni o'chirasizmi?")) return;
    await supabase.from("modules").delete().eq("id", id);
    toast.success("Modul o'chirildi"); fetchData();
  }

  async function toggleModulePublish(mod: Module) {
    await supabase.from("modules").update({ is_published: !mod.is_published }).eq("id", mod.id);
    fetchData();
  }

  // ── Lesson CRUD ──
  function extractYtId(input: string): string {
    const m = input.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    return m ? m[1] : input.trim();
  }

  async function saveLesson(moduleId: string) {
    if (!lForm.title.trim()) { toast.error("Dars nomini kiriting"); return; }
    setSavingLesson(true);
    try {
      const payload = {
        title: lForm.title, description: lForm.description || null,
        youtube_video_id: lForm.youtube_video_id ? extractYtId(lForm.youtube_video_id) : null,
        duration_seconds: lForm.duration_seconds ? Number(lForm.duration_seconds) : null,
        order_index: lForm.order_index,
      };
      if (editLesson) {
        await supabase.from("lessons").update(payload).eq("id", editLesson.id);
        toast.success("Dars yangilandi!");
      } else {
        await supabase.from("lessons").insert({ ...payload, module_id: moduleId });
        toast.success("Dars qo'shildi!");
      }
      resetLessonForm(); fetchData();
    } catch (e: any) { toast.error(e.message); }
    finally { setSavingLesson(false); }
  }

  function resetLessonForm() {
    setShowLessonForm(null); setEditLesson(null);
    setLForm({ title: "", description: "", youtube_video_id: "", duration_seconds: "", order_index: 1 });
  }

  function startEditLesson(lesson: Lesson, moduleId: string) {
    setEditLesson(lesson);
    setLForm({
      title: lesson.title, description: "",
      youtube_video_id: lesson.youtube_video_id ?? "",
      duration_seconds: lesson.duration_seconds ? String(lesson.duration_seconds) : "",
      order_index: lesson.order_index,
    });
    setShowLessonForm(moduleId);
  }

  async function deleteLesson(id: string) {
    if (!confirm("Darsni o'chirasizmi?")) return;
    await supabase.from("lessons").delete().eq("id", id);
    toast.success("O'chirildi"); fetchData();
  }

  async function toggleLessonPublish(lesson: Lesson) {
    await supabase.from("lessons").update({ is_published: !lesson.is_published }).eq("id", lesson.id);
    fetchData();
  }

  function toggleExpand(moduleId: string) {
    setExpandedModules(prev => {
      const next = new Set<string>(Array.from(prev));
      if (next.has(moduleId)) next.delete(moduleId); else next.add(moduleId);
      return next;
    });
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm flex-wrap">
        <Link href="/admin/courses" className="flex items-center gap-1 hover:text-purple-600 transition-colors"
          style={{ color: "var(--text-secondary)" }}>
          <ChevronLeft size={16} /> Kurslar
        </Link>
        <span style={{ color: "var(--text-tertiary)" }}>/</span>
        <span className="font-semibold truncate max-w-xs" style={{ color: "var(--text-primary)" }}>
          {course?.title ?? "..."}
        </span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            {course?.title}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
            {course?.subject} · {modules.length} modul
          </p>
        </div>
        <button onClick={() => { setMForm(f => ({ ...f, order_index: modules.length + 1 })); setShowModuleForm(true); }}
          className="btn-primary">
          <Plus size={17} /> Modul qo&apos;shish
        </button>
      </div>

      {/* ── MODULE FORM MODAL ── */}
      {showModuleForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="w-full max-w-lg rounded-2xl p-6 shadow-xl" style={{ background: "var(--surface)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                {editModule ? "Modulni tahrirlash" : "Yangi modul"}
              </h2>
              <button onClick={resetModuleForm} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-secondary)]"
                style={{ color: "var(--text-secondary)" }}><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>Modul nomi *</label>
                <input className="input" value={mForm.title} onChange={e => setMForm({ ...mForm, title: e.target.value })}
                  placeholder="Masalan: 1-Modul: Algoritmlar" autoFocus />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>Tavsif</label>
                <textarea className="input resize-none" rows={2} value={mForm.description}
                  onChange={e => setMForm({ ...mForm, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>Tartib</label>
                  <input type="number" className="input" min={1} value={mForm.order_index}
                    onChange={e => setMForm({ ...mForm, order_index: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>O&apos;tish bali (%)</label>
                  <input type="number" className="input" min={1} max={100} value={mForm.passing_score}
                    onChange={e => setMForm({ ...mForm, passing_score: Number(e.target.value) })} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={saveModule} disabled={savingModule} className="btn-primary flex-1">
                {savingModule && <Loader2 size={16} className="animate-spin" />}
                {editModule ? "Saqlash" : "Qo'shish"}
              </button>
              <button onClick={resetModuleForm} className="btn-secondary flex-1">Bekor</button>
            </div>
          </div>
        </div>
      )}

      {/* ── LESSON FORM MODAL ── */}
      {showLessonForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="w-full max-w-lg rounded-2xl p-6 shadow-xl my-8" style={{ background: "var(--surface)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                {editLesson ? "Darsni tahrirlash" : "Yangi dars"}
              </h2>
              <button onClick={resetLessonForm} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-secondary)]"
                style={{ color: "var(--text-secondary)" }}><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>Dars nomi *</label>
                <input className="input" value={lForm.title} onChange={e => setLForm({ ...lForm, title: e.target.value })}
                  placeholder="Masalan: Algoritm nima?" autoFocus />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>Tavsif</label>
                <textarea className="input resize-none" rows={2} value={lForm.description}
                  onChange={e => setLForm({ ...lForm, description: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>
                  YouTube URL yoki Video ID
                </label>
                <div className="relative">
                  <Youtube size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-red-500" />
                  <input className="input pl-10" value={lForm.youtube_video_id}
                    onChange={e => setLForm({ ...lForm, youtube_video_id: e.target.value })}
                    placeholder="https://youtube.com/watch?v=... yoki dQw4w9WgXcQ" />
                </div>
                {lForm.youtube_video_id && (
                  <div className="mt-2 rounded-xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${extractYtId(lForm.youtube_video_id)}`}
                      className="w-full h-full" allowFullScreen title="preview" />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>
                    Davomiyligi (soniya)
                  </label>
                  <input type="number" className="input" value={lForm.duration_seconds}
                    onChange={e => setLForm({ ...lForm, duration_seconds: e.target.value })}
                    placeholder="Masalan: 1200 = 20 daqiqa" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>Tartib</label>
                  <input type="number" className="input" min={1} value={lForm.order_index}
                    onChange={e => setLForm({ ...lForm, order_index: Number(e.target.value) })} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => saveLesson(showLessonForm)} disabled={savingLesson} className="btn-primary flex-1">
                {savingLesson && <Loader2 size={16} className="animate-spin" />}
                {editLesson ? "Saqlash" : "Dars qo'shish"}
              </button>
              <button onClick={resetLessonForm} className="btn-secondary flex-1">Bekor</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODULES LIST ── */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={32} className="animate-spin" style={{ color: "var(--text-tertiary)" }} />
        </div>
      ) : modules.length === 0 ? (
        <div className="card p-12 text-center">
          <BookOpen size={36} className="mx-auto mb-3" style={{ color: "#a855f7" }} />
          <p className="font-bold mb-1" style={{ color: "var(--text-primary)" }}>Hali modul yo&apos;q</p>
          <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
            Birinchi modulni qo&apos;shib kursni tuzishni boshlang
          </p>
          <button onClick={() => setShowModuleForm(true)} className="btn-primary">
            <Plus size={17} /> Modul qo&apos;shish
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {modules.map((mod) => (
            <div key={mod.id} className="card overflow-hidden">
              {/* Module header */}
              <div className="flex items-center gap-3 p-4">
                <GripVertical size={17} className="flex-shrink-0 cursor-grab" style={{ color: "var(--text-tertiary)" }} />
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
                  style={{ background: "linear-gradient(135deg,#a855f7,#7c3aed)" }}>
                  {mod.order_index}
                </div>
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleExpand(mod.id)}>
                  <div className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{mod.title}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                    {mod.lessons?.length ?? 0} dars · O&apos;tish bali: {mod.passing_score}%
                  </div>
                </div>
                <span className={`badge ${mod.is_published ? "badge-green" : "badge-yellow"} flex-shrink-0`}>
                  {mod.is_published ? "Nashr" : "Yashirin"}
                </span>
                {/* Module actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => {
                      setShowLessonForm(mod.id);
                      setEditLesson(null);
                      setLForm(f => ({ ...f, order_index: (mod.lessons?.length ?? 0) + 1 }));
                      setExpandedModules(prev => new Set([...prev, mod.id]));
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:bg-[var(--bg-tertiary)]"
                    style={{ color: "#a855f7" }}>
                    <Plus size={13} /> Dars
                  </button>
                  <button onClick={() => toggleModulePublish(mod)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--bg-tertiary)] transition-colors"
                    style={{ color: "var(--text-secondary)" }}>
                    {mod.is_published ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button onClick={() => { setEditModule(mod); setMForm({ title: mod.title, description: mod.description ?? "", order_index: mod.order_index, passing_score: mod.passing_score }); setShowModuleForm(true); }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--bg-tertiary)] transition-colors"
                    style={{ color: "var(--text-secondary)" }}>
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => deleteModule(mod.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                  <button onClick={() => toggleExpand(mod.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--bg-tertiary)] transition-colors"
                    style={{ color: "var(--text-secondary)" }}>
                    {expandedModules.has(mod.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>

              {/* Lessons list (expanded) */}
              {expandedModules.has(mod.id) && (
                <div className="border-t" style={{ borderColor: "var(--border)" }}>
                  {(mod.lessons?.length ?? 0) === 0 ? (
                    <div className="px-12 py-6 text-center">
                      <Play size={22} className="mx-auto mb-2" style={{ color: "var(--text-tertiary)" }} />
                      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Hali dars yo&apos;q</p>
                      <button onClick={() => { setShowLessonForm(mod.id); setEditLesson(null); }}
                        className="mt-3 text-sm font-semibold flex items-center gap-1 mx-auto" style={{ color: "#a855f7" }}>
                        <Plus size={14} /> Birinchi darsni qo&apos;shing
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                      {mod.lessons?.map((lesson) => (
                        <div key={lesson.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-secondary)] transition-colors">
                          <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ background: "rgba(168,85,247,0.1)", color: "#a855f7" }}>
                            {lesson.order_index}
                          </div>
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${lesson.youtube_video_id ? "bg-red-50" : "bg-[var(--bg-tertiary)]"}`}>
                            {lesson.youtube_video_id
                              ? <Youtube size={14} className="text-red-500" />
                              : <Play size={14} style={{ color: "var(--text-tertiary)" }} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate" style={{ color: "var(--text-primary)" }}>
                              {lesson.title}
                            </div>
                            {lesson.duration_seconds && (
                              <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                                {Math.round(lesson.duration_seconds / 60)} daqiqa
                              </div>
                            )}
                          </div>
                          <span className={`badge text-xs ${lesson.is_published ? "badge-green" : "badge-yellow"}`}>
                            {lesson.is_published ? "Nashr" : "Yashirin"}
                          </span>
                          <div className="flex gap-1 flex-shrink-0">
                            <button onClick={() => toggleLessonPublish(lesson)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--bg-tertiary)] transition-colors"
                              style={{ color: "var(--text-secondary)" }}>
                              {lesson.is_published ? <EyeOff size={13} /> : <Eye size={13} />}
                            </button>
                            <button onClick={() => startEditLesson(lesson, mod.id)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--bg-tertiary)] transition-colors"
                              style={{ color: "var(--text-secondary)" }}>
                              <Edit2 size={13} />
                            </button>
                            <button onClick={() => deleteLesson(lesson.id)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 text-red-500 transition-colors">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Add lesson button at bottom */}
                  <div className="px-4 py-2.5 border-t" style={{ borderColor: "var(--border)" }}>
                    <button
                      onClick={() => {
                        setShowLessonForm(mod.id); setEditLesson(null);
                        setLForm(f => ({ ...f, title: "", youtube_video_id: "", description: "", duration_seconds: "", order_index: (mod.lessons?.length ?? 0) + 1 }));
                      }}
                      className="flex items-center gap-2 text-sm font-semibold transition-colors"
                      style={{ color: "#a855f7" }}>
                      <Plus size={15} /> Yangi dars qo&apos;shish
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
