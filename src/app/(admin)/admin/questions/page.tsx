"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, HelpCircle, Trash2, Loader2, X, Check, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

interface Option { id: string; text: string; }
interface Question {
  id: string; text: string; options: Option[];
  correct_option_id: string; explanation?: string;
  difficulty: string; subject: string; created_at: string;
}

const SUBJECTS = ["Informatika","Matematika","Fizika","Kimyo","Biologiya","Ona tili","Tarix","Ingliz tili"];
function makeId() { return Math.random().toString(36).slice(2,8); }

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState({ subject: "", difficulty: "" });
  const [form, setForm] = useState({
    text: "", subject: "Informatika", difficulty: "medium", explanation: "",
    options: [
      { id: makeId(), text: "" }, { id: makeId(), text: "" },
      { id: makeId(), text: "" }, { id: makeId(), text: "" },
    ],
    correct_option_id: "",
  });
  const supabase = createClient();

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("questions").select("*").order("created_at", { ascending: false });
    if (filter.subject) q = q.eq("subject", filter.subject);
    if (filter.difficulty) q = q.eq("difficulty", filter.difficulty);
    const { data } = await q.limit(100);
    setQuestions(data ?? []);
    setLoading(false);
  }, [filter, supabase]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  const filtered = questions.filter(q =>
    !search || q.text.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSave() {
    if (!form.text.trim()) { toast.error("Savol matnini kiriting"); return; }
    const filled = form.options.filter(o => o.text.trim());
    if (filled.length < 2) { toast.error("Kamida 2 ta variant kiriting"); return; }
    if (!form.correct_option_id) { toast.error("To'g'ri javobni belgilang (✓)"); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from("questions").insert({
        text: form.text, subject: form.subject, difficulty: form.difficulty,
        explanation: form.explanation || null,
        options: form.options.filter(o => o.text.trim()),
        correct_option_id: form.correct_option_id,
      });
      if (error) throw error;
      toast.success("Savol qo'shildi!");
      resetForm(); fetchQuestions();
    } catch (e: any) { toast.error(e.message ?? "Xatolik"); }
    finally { setSaving(false); }
  }

  async function deleteQuestion(id: string) {
    if (!confirm("Savolni o'chirasizmi?")) return;
    await supabase.from("questions").delete().eq("id", id);
    toast.success("O'chirildi"); fetchQuestions();
  }

  function resetForm() {
    setShowForm(false);
    setForm({
      text: "", subject: "Informatika", difficulty: "medium", explanation: "",
      options: [{ id: makeId(), text: "" }, { id: makeId(), text: "" }, { id: makeId(), text: "" }, { id: makeId(), text: "" }],
      correct_option_id: "",
    });
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>Savollar banki</h1>
          <p style={{ color: "var(--text-secondary)" }}>Test va imtihon savollari</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={18} /> Savol qo&apos;shish
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Jami savollar", value: questions.length, color: "rgba(168,85,247,0.1)", ic: "#a855f7" },
          { label: "Informatika", value: questions.filter(q => q.subject === "Informatika").length, color: "rgba(59,130,246,0.1)", ic: "#3b82f6" },
          { label: "Oson savollar", value: questions.filter(q => q.difficulty === "easy").length, color: "rgba(16,185,129,0.1)", ic: "#10b981" },
        ].map(s => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.color }}>
              <HelpCircle size={18} style={{ color: s.ic }} />
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{s.value}</div>
              <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
          <input className="input pl-9 w-full text-sm" placeholder="Savol qidirish..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto text-sm" value={filter.subject}
          onChange={e => setFilter({ ...filter, subject: e.target.value })}>
          <option value="">Barcha fanlar</option>
          {SUBJECTS.map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="input w-auto text-sm" value={filter.difficulty}
          onChange={e => setFilter({ ...filter, difficulty: e.target.value })}>
          <option value="">Barcha darajalar</option>
          <option value="easy">Oson</option>
          <option value="medium">O'rta</option>
          <option value="hard">Qiyin</option>
        </select>
      </div>

      {/* Questions list */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
          <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
            {filtered.length} ta savol
          </span>
        </div>
        {loading ? (
          <div className="p-8 flex justify-center"><Loader2 size={28} className="animate-spin" style={{ color: "var(--text-tertiary)" }} /></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <HelpCircle size={36} className="mx-auto mb-3" style={{ color: "var(--text-tertiary)" }} />
            <p className="mb-4" style={{ color: "var(--text-secondary)" }}>Savollar yo&apos;q</p>
            <button onClick={() => setShowForm(true)} className="btn-primary text-sm">Savol qo&apos;shish</button>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {filtered.map((q) => (
              <div key={q.id} className="p-4 hover:bg-[var(--bg-secondary)] transition-colors">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm mb-2 leading-relaxed" style={{ color: "var(--text-primary)" }}>
                      {q.text}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {q.options?.map((opt: Option) => (
                        <span key={opt.id}
                          className={`text-xs px-2.5 py-1 rounded-lg font-medium ${opt.id === q.correct_option_id ? "bg-green-100 dark:bg-green-900 text-green-700" : ""}`}
                          style={opt.id !== q.correct_option_id ? { background: "var(--bg-tertiary)", color: "var(--text-secondary)" } : {}}>
                          {opt.id === q.correct_option_id && "✓ "}{opt.text}
                        </span>
                      ))}
                    </div>
                    {q.explanation && (
                      <p className="text-xs italic" style={{ color: "var(--text-tertiary)" }}>
                        💡 {q.explanation}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="badge-blue text-xs">{q.subject}</span>
                      <span className={`badge text-xs ${q.difficulty === "easy" ? "badge-green" : q.difficulty === "hard" ? "badge-red" : "badge-yellow"}`}>
                        {q.difficulty === "easy" ? "Oson" : q.difficulty === "hard" ? "Qiyin" : "O'rta"}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => deleteQuestion(q.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 text-red-500 flex-shrink-0 transition-colors">
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
          <div className="w-full max-w-2xl rounded-2xl p-6 shadow-xl my-8" style={{ background: "var(--surface)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Yangi savol</h2>
              <button onClick={resetForm} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-secondary)]"
                style={{ color: "var(--text-secondary)" }}><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>Savol matni *</label>
                <textarea className="input resize-none" rows={3} value={form.text}
                  onChange={e => setForm({ ...form, text: e.target.value })}
                  placeholder="Savolni kiriting..." autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>Fan</label>
                  <select className="input" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}>
                    {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>Daraja</label>
                  <select className="input" value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}>
                    <option value="easy">Oson</option>
                    <option value="medium">O'rta</option>
                    <option value="hard">Qiyin</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                  Variantlar
                  <span className="font-normal ml-2 text-xs" style={{ color: "var(--text-tertiary)" }}>
                    (✓ tugmasini bosib to&apos;g&apos;ri javobni belgilang)
                  </span>
                </label>
                <div className="space-y-2">
                  {form.options.map((opt, i) => (
                    <div key={opt.id} className="flex gap-2 items-center">
                      <button type="button"
                        onClick={() => setForm(f => ({ ...f, correct_option_id: opt.id }))}
                        className="w-8 h-8 rounded-lg flex items-center justify-center border-2 flex-shrink-0 transition-all"
                        style={{
                          borderColor: form.correct_option_id === opt.id ? "#10b981" : "var(--border)",
                          background: form.correct_option_id === opt.id ? "#10b981" : "transparent",
                          color: form.correct_option_id === opt.id ? "white" : "var(--text-tertiary)",
                        }}>
                        <Check size={14} />
                      </button>
                      <span className="w-6 text-sm font-bold flex-shrink-0 text-center"
                        style={{ color: "var(--text-tertiary)" }}>
                        {["A","B","C","D"][i]}
                      </span>
                      <input className="input flex-1" placeholder={`${i + 1}-variant`}
                        value={opt.text}
                        onChange={e => setForm(f => ({ ...f, options: f.options.map(o => o.id === opt.id ? { ...o, text: e.target.value } : o) }))} />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>
                  Tushuntirish <span className="font-normal" style={{ color: "var(--text-tertiary)" }}>(ixtiyoriy)</span>
                </label>
                <textarea className="input resize-none" rows={2} value={form.explanation}
                  onChange={e => setForm({ ...form, explanation: e.target.value })}
                  placeholder="Nima uchun bu javob to'g'ri?" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
                {saving && <Loader2 size={16} className="animate-spin" />} Saqlash
              </button>
              <button onClick={resetForm} className="btn-secondary flex-1">Bekor</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
