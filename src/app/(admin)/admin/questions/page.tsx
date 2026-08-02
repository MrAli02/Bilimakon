"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, HelpCircle, Trash2, Loader2, X, Check, Search, Upload, Download, FileSpreadsheet, AlertCircle, BookOpen, Layers } from "lucide-react";
import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

interface Option { id: string; text: string; }
interface Question {
  id: string; text: string; options: Option[];
  correct_option_id: string; explanation?: string;
  difficulty: string; subject: string; created_at: string;
  lesson_id?: string; module_id?: string;
}

const SUBJECTS = ["Informatika","Matematika","Fizika","Kimyo","Biologiya","Ona tili","Tarix","Ingliz tili","Kasbiy standart","Pedagogik mahorat"];
// Faqat platformada haqiqatan ishlatiladigan 3 asosiy fan tab uchun (qolganlari "Boshqa" ostida ko'rinadi agar mavjud bo'lsa)
const MAIN_SUBJECTS = ["Informatika", "Kasbiy standart", "Pedagogik mahorat"];

function makeId() { return Math.random().toString(36).slice(2,8); }

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  interface LessonOption { id: string; title: string; module_title: string; course_title: string; }
  const [lessons, setLessons] = useState<LessonOption[]>([]);
  interface ModuleOption { id: string; title: string; course_title: string; }
  const [modules, setModules] = useState<ModuleOption[]>([]);
  interface ExcelRow {
    row: number; text: string; options: Option[]; correct_option_id: string;
    subject: string; difficulty: string; explanation?: string; lesson_id?: string; error?: string;
  }
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [editQuestion, setEditQuestion] = useState<Question | null>(null);
  const [excelPreview, setExcelPreview] = useState<ExcelRow[]>([]);
  const [excelUploading, setExcelUploading] = useState(false);
  const [excelFileName, setExcelFileName] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>("Barchasi");
  const [filter, setFilter] = useState({ difficulty: "", scope: "" }); // scope: "" | "module" | "lesson" | "general"
  const [form, setForm] = useState({
    text: "", subject: "Informatika", difficulty: "medium", explanation: "", lesson_id: "", module_id: "",
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
    if (filter.difficulty) q = q.eq("difficulty", filter.difficulty);
    const { data } = await q.limit(300);
    setQuestions(data ?? []);
    setLoading(false);
  }, [filter, supabase]);

  const fetchLessons = useCallback(async () => {
    const { data } = await supabase
      .from("lessons")
      .select("id, title, modules(title, courses(title))")
      .order("order_index");
    const formatted = (data ?? []).map((l: any) => ({
      id: l.id,
      title: l.title,
      module_title: l.modules?.title ?? "",
      course_title: l.modules?.courses?.title ?? "",
    }));
    setLessons(formatted);
  }, [supabase]);

  const fetchModules = useCallback(async () => {
    const { data } = await supabase
      .from("modules")
      .select("id, title, courses(title)")
      .order("order_index");
    const formatted = (data ?? []).map((m: any) => ({
      id: m.id,
      title: m.title,
      course_title: m.courses?.title ?? "",
    }));
    setModules(formatted);
  }, [supabase]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);
  useEffect(() => { fetchLessons(); }, [fetchLessons]);
  useEffect(() => { fetchModules(); }, [fetchModules]);

  const lessonMap = useMemo(() => Object.fromEntries(lessons.map(l => [l.id, l])), [lessons]);
  const moduleMap = useMemo(() => Object.fromEntries(modules.map(m => [m.id, m])), [modules]);

  // Fan bo'yicha savollar soni — tablarda ko'rsatish uchun
  const countsBySubject = useMemo(() => {
    const c: Record<string, number> = {};
    for (const s of SUBJECTS) c[s] = questions.filter(q => q.subject === s).length;
    return c;
  }, [questions]);

  const otherSubjectsUsed = useMemo(
    () => SUBJECTS.filter(s => !MAIN_SUBJECTS.includes(s) && countsBySubject[s] > 0),
    [countsBySubject]
  );

  const filtered = useMemo(() => questions.filter(q => {
    if (activeTab !== "Barchasi" && q.subject !== activeTab) return false;
    if (filter.scope === "module" && !q.module_id) return false;
    if (filter.scope === "lesson" && !q.lesson_id) return false;
    if (filter.scope === "general" && (q.module_id || q.lesson_id)) return false;
    if (search && !q.text.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [questions, activeTab, filter.scope, search]);

  async function handleSave() {
    if (!form.text.trim()) { toast.error("Savol matnini kiriting"); return; }
    const filled = form.options.filter(o => o.text.trim());
    if (filled.length < 2) { toast.error("Kamida 2 ta variant kiriting"); return; }
    if (!form.correct_option_id) { toast.error("To'g'ri javobni belgilang (✓)"); return; }
    setSaving(true);
    try {
      const payload = {
        text: form.text, subject: form.subject, difficulty: form.difficulty,
        explanation: form.explanation || null,
        lesson_id: form.lesson_id || null,
        module_id: form.module_id || null,
        options: form.options.filter(o => o.text.trim()),
        correct_option_id: form.correct_option_id,
      };
      if (editQuestion) {
        const { error } = await supabase.from("questions").update(payload).eq("id", editQuestion.id);
        if (error) throw error;
        toast.success("Savol yangilandi!");
      } else {
        const { error } = await supabase.from("questions").insert(payload);
        if (error) throw error;
        toast.success("Savol qo'shildi!");
      }
      resetForm(); fetchQuestions();
    } catch (e: any) { toast.error(e.message ?? "Xatolik"); }
    finally { setSaving(false); }
  }

  function startEditQuestion(q: Question) {
    setEditQuestion(q);
    setForm({
      text: q.text, subject: q.subject, difficulty: q.difficulty,
      explanation: q.explanation ?? "", lesson_id: q.lesson_id ?? "", module_id: q.module_id ?? "",
      options: q.options.length >= 4 ? q.options : [...q.options, ...Array(4 - q.options.length).fill(0).map(() => ({ id: makeId(), text: "" }))],
      correct_option_id: q.correct_option_id,
    });
    setShowForm(true);
  }

  async function deleteQuestion(id: string) {
    if (!confirm("Savolni o'chirasizmi?")) return;
    await supabase.from("questions").delete().eq("id", id);
    toast.success("O'chirildi"); fetchQuestions();
  }

  function resetForm() {
    setShowForm(false);
    setEditQuestion(null);
    setForm({
      text: "", subject: activeTab !== "Barchasi" ? activeTab : "Informatika", difficulty: "medium", explanation: "", lesson_id: "", module_id: "",
      options: [{ id: makeId(), text: "" }, { id: makeId(), text: "" }, { id: makeId(), text: "" }, { id: makeId(), text: "" }],
      correct_option_id: "",
    });
  }

  function downloadTemplate() {
    const wsData = [
      ["Fan", "Kurs", "Modul", "Dars", "Savol", "A", "B", "C", "D", "Togri_javob", "Daraja", "Tushuntirish"],
      ["Informatika", "", "", "", "Algoritm nima?", "Dastur", "Buyruqlar ketma-ketligi", "Dastur tili", "Kompyuter", "B", "orta", "Algoritm - masalani yechish uchun buyruqlar ketma-ketligi"],
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Savollar");
    XLSX.writeFile(wb, "savollar_shablon.xlsx");
  }

  function handleExcelFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setExcelFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      const wb = XLSX.read(data, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 });
      const parsed: ExcelRow[] = [];
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r || r.length === 0 || !r[4]) continue;
        const rowNum = i + 1;
        const subject = String(r[0] ?? "").trim();
        const courseTitle = String(r[1] ?? "").trim();
        const moduleTitle = String(r[2] ?? "").trim();
        const lessonTitle = String(r[3] ?? "").trim();
        const text = String(r[4] ?? "").trim();
        const optA = String(r[5] ?? "").trim();
        const optB = String(r[6] ?? "").trim();
        const optC = String(r[7] ?? "").trim();
        const optD = String(r[8] ?? "").trim();
        const correctLetter = String(r[9] ?? "").trim().toUpperCase();
        const difficultyRaw = String(r[10] ?? "orta").trim().toLowerCase();
        const explanation = String(r[11] ?? "").trim();

        let error = "";
        if (!subject || !SUBJECTS.includes(subject)) error = `Fan noto'g'ri yoki bo'sh (${subject})`;
        else if (!text) error = "Savol matni bo'sh";
        else if (!optA || !optB) error = "A va B variantlar majburiy";
        else if (!["A", "B", "C", "D"].includes(correctLetter)) error = "To'g'ri javob A/B/C/D bo'lishi kerak";

        const options: Option[] = [];
        const ids: Record<string, string> = { A: makeId(), B: makeId(), C: makeId(), D: makeId() };
        if (optA) options.push({ id: ids.A, text: optA });
        if (optB) options.push({ id: ids.B, text: optB });
        if (optC) options.push({ id: ids.C, text: optC });
        if (optD) options.push({ id: ids.D, text: optD });

        if (!error && correctLetter && !ids[correctLetter]) error = "To'g'ri javob harfi noto'g'ri";

        let lesson_id: string | undefined;
        if (!error && lessonTitle) {
          const match = lessons.find(l =>
            l.title.trim().toLowerCase() === lessonTitle.toLowerCase() &&
            (!moduleTitle || l.module_title.toLowerCase() === moduleTitle.toLowerCase()) &&
            (!courseTitle || l.course_title.toLowerCase() === courseTitle.toLowerCase())
          );
          if (match) lesson_id = match.id;
        }

        const difficulty = difficultyRaw === "oson" ? "easy" : difficultyRaw === "qiyin" ? "hard" : "medium";

        parsed.push({
          row: rowNum, text, options,
          correct_option_id: !error ? ids[correctLetter] : "",
          subject, difficulty, explanation: explanation || undefined,
          lesson_id, error: error || undefined,
        });
      }
      setExcelPreview(parsed);
    };
    reader.readAsBinaryString(file);
  }

  async function confirmExcelUpload() {
    const validRows = excelPreview.filter(r => !r.error);
    if (validRows.length === 0) { toast.error("Yuklash uchun to'g'ri qator yo'q"); return; }
    setExcelUploading(true);
    try {
      const inserts = validRows.map(r => ({
        text: r.text, subject: r.subject, difficulty: r.difficulty,
        explanation: r.explanation || null, lesson_id: r.lesson_id || null,
        options: r.options, correct_option_id: r.correct_option_id,
      }));
      const { error } = await supabase.from("questions").insert(inserts);
      if (error) throw error;
      toast.success(`${validRows.length} ta savol yuklandi!`);
      setShowExcelModal(false); setExcelPreview([]); setExcelFileName("");
      fetchQuestions();
    } catch (e: any) {
      toast.error(e.message ?? "Xatolik");
    } finally {
      setExcelUploading(false);
    }
  }

  const tabs = [
    { key: "Barchasi", label: "Barchasi", count: questions.length },
    ...MAIN_SUBJECTS.map(s => ({ key: s, label: s, count: countsBySubject[s] })),
    ...(otherSubjectsUsed.length > 0
      ? otherSubjectsUsed.map(s => ({ key: s, label: s, count: countsBySubject[s] }))
      : []),
  ];

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>Savollar banki</h1>
          <p style={{ color: "var(--text-secondary)" }}>Test va imtihon savollari</p>
        </div>
        <div className="flex gap-2">
          <button onClick={downloadTemplate} className="btn-secondary text-sm">
            <Download size={16} /> Shablon
          </button>
          <button onClick={() => setShowExcelModal(true)} className="btn-secondary text-sm">
            <Upload size={16} /> Excel yuklash
          </button>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary">
            <Plus size={18} /> Savol qo&apos;shish
          </button>
        </div>
      </div>

      {/* Subject tabs — bu asosiy tartiblovchi element */}
      <div className="flex flex-wrap gap-2 mb-5 pb-1">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
            style={{
              background: activeTab === t.key ? "linear-gradient(135deg,#a855f7,#7c3aed)" : "var(--bg-secondary)",
              color: activeTab === t.key ? "white" : "var(--text-secondary)",
              boxShadow: activeTab === t.key ? "0 4px 12px rgba(124,58,237,0.25)" : "none",
            }}
          >
            {t.label}
            <span
              className="text-xs px-1.5 py-0.5 rounded-md font-bold"
              style={{
                background: activeTab === t.key ? "rgba(255,255,255,0.25)" : "var(--bg-tertiary)",
                color: activeTab === t.key ? "white" : "var(--text-tertiary)",
              }}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
          <input className="input pl-9 w-full text-sm" placeholder="Savol qidirish..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto text-sm" value={filter.scope}
          onChange={e => setFilter({ ...filter, scope: e.target.value })}>
          <option value="">Qayerga bog'langan — barchasi</option>
          <option value="module">Faqat modul imtihoniga bog'langan</option>
          <option value="lesson">Faqat darsga bog'langan</option>
          <option value="general">Bog'lanmagan (umumiy / simulyator uchun)</option>
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
            <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary text-sm">Savol qo&apos;shish</button>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {filtered.map((q) => {
              const lesson = q.lesson_id ? lessonMap[q.lesson_id] : null;
              const mod = q.module_id ? moduleMap[q.module_id] : null;
              return (
                <div key={q.id} className="p-4 hover:bg-[var(--bg-secondary)] transition-colors">
                  {/* Top meta row — fan, daraja, qayerga bog'langani birinchi bo'lib ko'rinadi */}
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="badge-blue text-xs">{q.subject}</span>
                      <span className={`badge text-xs ${q.difficulty === "easy" ? "badge-green" : q.difficulty === "hard" ? "badge-red" : "badge-yellow"}`}>
                        {q.difficulty === "easy" ? "Oson" : q.difficulty === "hard" ? "Qiyin" : "O'rta"}
                      </span>
                      {mod ? (
                        <span className="text-xs px-2.5 py-1 rounded-lg font-medium flex items-center gap-1"
                          style={{ background: "rgba(168,85,247,0.1)", color: "#a855f7" }}>
                          <Layers size={11} /> Modul: {mod.course_title} / {mod.title}
                        </span>
                      ) : lesson ? (
                        <span className="text-xs px-2.5 py-1 rounded-lg font-medium flex items-center gap-1"
                          style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6" }}>
                          <BookOpen size={11} /> Dars: {lesson.module_title} / {lesson.title}
                        </span>
                      ) : (
                        <span className="text-xs px-2.5 py-1 rounded-lg font-medium"
                          style={{ background: "var(--bg-tertiary)", color: "var(--text-tertiary)" }}>
                          Umumiy (simulyator uchun)
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => startEditQuestion(q)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-tertiary)] transition-colors text-sm"
                        style={{ color: "var(--text-secondary)" }}>
                        ✏️
                      </button>
                      <button onClick={() => deleteQuestion(q.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 text-red-500 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Savol matni — eng ko'zga tashlanadigan qism */}
                  <p className="font-semibold text-sm mb-3 leading-relaxed" style={{ color: "var(--text-primary)" }}>
                    {q.text}
                  </p>

                  {/* Variantlar — 2 ustunli tartibli grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-2">
                    {q.options?.map((opt: Option, i: number) => {
                      const isCorrect = opt.id === q.correct_option_id;
                      return (
                        <div key={opt.id}
                          className="text-xs px-3 py-2 rounded-lg font-medium flex items-center gap-2"
                          style={isCorrect
                            ? { background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)" }
                            : { background: "var(--bg-tertiary)", color: "var(--text-secondary)", border: "1px solid transparent" }}>
                          <span className="w-4 flex-shrink-0 font-bold opacity-60">{["A","B","C","D"][i]}</span>
                          <span className="flex-1">{opt.text}</span>
                          {isCorrect && <Check size={13} className="flex-shrink-0" />}
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <p className="text-xs italic mt-2" style={{ color: "var(--text-tertiary)" }}>
                      💡 {q.explanation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* EXCEL UPLOAD MODAL */}
      {showExcelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="w-full max-w-3xl rounded-2xl p-6 shadow-xl my-8" style={{ background: "var(--surface)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Excel orqali savol yuklash</h2>
              <button onClick={() => { setShowExcelModal(false); setExcelPreview([]); setExcelFileName(""); }}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-secondary)]"
                style={{ color: "var(--text-secondary)" }}><X size={18} /></button>
            </div>

            {excelPreview.length === 0 ? (
              <div className="text-center py-10 rounded-xl" style={{ border: "1.5px dashed var(--border)", background: "var(--bg-secondary)" }}>
                <FileSpreadsheet size={40} className="mx-auto mb-3" style={{ color: "var(--text-tertiary)" }} />
                <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
                  Avval shablonni yuklab oling, to&apos;ldiring, so&apos;ng shu yerga yuklang
                </p>
                <label className="btn-primary inline-flex cursor-pointer">
                  <Upload size={16} /> Excel faylni tanlash
                  <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleExcelFile} />
                </label>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {excelFileName} — {excelPreview.length} qator topildi
                  </p>
                  <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {excelPreview.filter(r => !r.error).length} to&apos;g&apos;ri · {excelPreview.filter(r => r.error).length} xato
                  </span>
                </div>
                <div className="max-h-80 overflow-y-auto rounded-xl" style={{ border: "1px solid var(--border)" }}>
                  {excelPreview.map((r, i) => (
                    <div key={i} className="p-3 text-xs flex items-start gap-2"
                      style={{ borderBottom: i < excelPreview.length - 1 ? "1px solid var(--border)" : "none",
                        background: r.error ? "rgba(239,68,68,0.05)" : "transparent" }}>
                      <span className="font-bold flex-shrink-0" style={{ color: "var(--text-tertiary)" }}>#{r.row}</span>
                      {r.error ? (
                        <span className="flex items-center gap-1 text-red-500">
                          <AlertCircle size={13} /> {r.error}
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-secondary)" }}>
                          <strong style={{ color: "var(--text-primary)" }}>{r.text}</strong> — {r.subject}
                          {r.lesson_id && " · darsga bog'landi"}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={confirmExcelUpload} disabled={excelUploading} className="btn-primary flex-1">
                    {excelUploading && <Loader2 size={16} className="animate-spin" />}
                    {excelPreview.filter(r => !r.error).length} ta savolni yuklash
                  </button>
                  <button onClick={() => { setExcelPreview([]); setExcelFileName(""); }} className="btn-secondary flex-1">
                    Qayta tanlash
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="w-full max-w-2xl rounded-2xl p-6 shadow-xl my-8" style={{ background: "var(--surface)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{editQuestion ? "Savolni tahrirlash" : "Yangi savol"}</h2>
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
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>
                    Dars <span className="font-normal" style={{ color: "var(--text-tertiary)" }}>(ixtiyoriy)</span>
                  </label>
                  <select className="input" value={form.lesson_id} onChange={e => setForm({ ...form, lesson_id: e.target.value, module_id: e.target.value ? "" : form.module_id })}>
                    <option value="">— Yo'q —</option>
                    {lessons.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.course_title} / {l.module_title} / {l.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>
                    Modul yakuniy imtihoni <span className="font-normal" style={{ color: "var(--text-tertiary)" }}>(ixtiyoriy)</span>
                  </label>
                  <select className="input" value={form.module_id} onChange={e => setForm({ ...form, module_id: e.target.value, lesson_id: e.target.value ? "" : form.lesson_id })}>
                    <option value="">— Yo'q —</option>
                    {modules.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.course_title} / {m.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-xs -mt-2" style={{ color: "var(--text-tertiary)" }}>
                Na dars, na modul tanlansa — savol "umumiy" hisoblanadi va faqat simulyatorda shu fan bo'yicha chiqadi.
              </p>
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
