"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, Award, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { shuffleArray } from "@/lib/utils";
import toast from "react-hot-toast";

type Phase = "intro" | "exam" | "result";

export default function ModuleExamPage() {
  const { courseId, moduleId } = useParams<{ courseId: string; moduleId: string }>();
  const [mod, setMod] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [phase, setPhase] = useState<Phase>("intro");
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const [{ data: m }, { data: qs }] = await Promise.all([
        supabase.from("modules").select("*, courses(id,title)").eq("id", moduleId).single(),
        supabase.from("questions").select("*").eq("module_id", moduleId),
      ]);
      setMod(m);
      setQuestions(shuffleArray(qs ?? []).map((q: any) => ({ ...q, options: shuffleArray(q.options) })));
      setLoading(false);
    }
    load();
  }, [moduleId, supabase]);

  function start() { setCurrent(0); setAnswers({}); setSelected(null); setPhase("exam"); }

  function selectAnswer(optId: string) {
    if (selected) return;
    setSelected(optId);
    setAnswers(p => ({ ...p, [questions[current].id]: optId }));
  }

  async function next() {
    if (current < questions.length - 1) {
      setCurrent(c => c + 1); setSelected(null);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const correct = questions.filter(q => answers[q.id] === q.correct_option_id).length;
      const score = Math.round((correct / questions.length) * 100);
      const passed = score >= (mod?.passing_score ?? 70);
      setSaving(true);
      try {
        await supabase.from("quiz_attempts").insert({
          user_id: user.id, module_id: moduleId, attempt_type: "module_exam",
          score: correct, total_questions: questions.length, passed,
          answers: Object.entries(answers).map(([qid, oid]) => ({
            question_id: qid, selected_option_id: oid,
            is_correct: questions.find(q => q.id === qid)?.correct_option_id === oid,
          })),
          finished_at: new Date().toISOString(),
        });
        if (passed) toast.success("Modul imtihonidan o'tdingiz! 🎉");
      } finally { setSaving(false); setPhase("result"); }
    }
  }

  if (loading) return (
    <div className="flex justify-center py-16">
      <Loader2 size={32} className="animate-spin" style={{ color: "#a855f7" }} />
    </div>
  );

  const q = questions[current];
  const correct = questions.filter(q => answers[q.id] === q.correct_option_id).length;
  const score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
  const passed = score >= (mod?.passing_score ?? 70);

  if (phase === "intro") return (
    <div className="max-w-2xl mx-auto text-center py-8 animate-fade-in">
      <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5"
        style={{ background: "linear-gradient(135deg,#a855f7,#7c3aed)", boxShadow: "0 8px 24px rgba(124,58,237,0.3)" }}>
        <Award size={40} className="text-white" />
      </div>
      <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Modul yakuniy imtihoni</h1>
      <p className="text-lg font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>{mod?.title}</p>
      <p className="mb-7 text-sm" style={{ color: "var(--text-tertiary)" }}>{mod?.courses?.title}</p>
      <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto mb-7">
        {[
          { label: "Savollar", value: questions.length },
          { label: "O'tish bali", value: `${mod?.passing_score ?? 70}%` },
          { label: "Urinishlar", value: "∞" },
        ].map(s => (
          <div key={s.label} className="card p-3 text-center">
            <div className="text-xl font-bold mb-0.5" style={{ color: "var(--text-primary)" }}>{s.value}</div>
            <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{s.label}</div>
          </div>
        ))}
      </div>
      {questions.length === 0 ? (
        <div className="card p-5 mb-5">
          <p style={{ color: "var(--text-secondary)" }}>Bu modul uchun savollar mavjud emas</p>
        </div>
      ) : (
        <button onClick={start} className="btn-primary px-8 py-3.5 text-base">
          Imtihonni boshlash <ChevronRight size={20} />
        </button>
      )}
      <div className="mt-5">
        <Link href={`/courses/${courseId}`} className="btn-ghost"><ChevronLeft size={16} /> Kursga qaytish</Link>
      </div>
    </div>
  );

  if (phase === "result") return (
    <div className="max-w-2xl mx-auto text-center py-8 animate-fade-in">
      <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-5 ${passed ? "bg-green-100 dark:bg-green-900" : "bg-red-100 dark:bg-red-900"}`}>
        {passed ? <CheckCircle size={50} className="text-green-600" /> : <XCircle size={50} className="text-red-500" />}
      </div>
      <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
        {passed ? "Barakalla! 🎉" : "Yana urinib ko'ring"}
      </h2>
      <p className="mb-6" style={{ color: "var(--text-secondary)" }}>
        {passed ? "Keyingi modul ochildi!" : `O'tish bali: ${mod?.passing_score ?? 70}%. Natijangiz: ${score}%`}
      </p>
      <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto mb-7">
        {[
          { label: "Ball", value: `${score}%`, color: passed ? "#10b981" : "#ef4444" },
          { label: "To'g'ri", value: correct, color: "#10b981" },
          { label: "Noto'g'ri", value: questions.length - correct, color: "#ef4444" },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <div className="text-2xl font-bold mb-0.5" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{s.label}</div>
          </div>
        ))}
      </div>
      {/* Wrong answers breakdown */}
      {questions.some(q => answers[q.id] !== q.correct_option_id) && (
        <div className="card p-5 text-left mb-5 max-h-64 overflow-y-auto">
          <p className="font-bold text-sm mb-3" style={{ color: "var(--text-primary)" }}>Noto'g'ri javoblar:</p>
          {questions.filter(q => answers[q.id] !== q.correct_option_id).map(q => {
            const co = q.options.find((o: any) => o.id === q.correct_option_id);
            const so = q.options.find((o: any) => o.id === answers[q.id]);
            return (
              <div key={q.id} className="mb-3 pb-3 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                <p className="text-xs font-medium mb-1" style={{ color: "var(--text-primary)" }}>{q.text}</p>
                <p className="text-xs text-red-500">✗ {so?.text ?? "Javob berilmadi"}</p>
                <p className="text-xs text-green-600">✓ {co?.text}</p>
                {q.explanation && <p className="text-xs italic mt-1" style={{ color: "var(--text-tertiary)" }}>💡 {q.explanation}</p>}
              </div>
            );
          })}
        </div>
      )}
      <div className="flex gap-3 justify-center flex-wrap">
        {!passed && <button onClick={start} className="btn-secondary">Qayta urinish</button>}
        <Link href={`/courses/${courseId}`} className="btn-primary">Kursga qaytish <ChevronRight size={16} /></Link>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <span className="badge-blue">{current + 1}/{questions.length}</span>
        <span className="text-sm font-medium truncate max-w-xs" style={{ color: "var(--text-secondary)" }}>{mod?.title}</span>
      </div>
      <div className="progress-bar mb-5">
        <div className="progress-fill" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
      </div>
      <div className="card p-6 mb-4">
        <p className="text-base font-semibold mb-5 leading-relaxed" style={{ color: "var(--text-primary)" }}>{q?.text}</p>
        <div className="space-y-2.5">
          {q?.options.map((opt: any, i: number) => {
            const isSel = selected === opt.id;
            const isCorrect = opt.id === q.correct_option_id;
            const showGreen = selected && isCorrect;
            const showRed = isSel && !isCorrect;
            return (
              <button key={opt.id} onClick={() => selectAnswer(opt.id)} disabled={!!selected}
                className="w-full text-left px-4 py-3.5 rounded-xl border-2 text-sm font-medium transition-all"
                style={{
                  borderColor: showGreen ? "#10b981" : showRed ? "#ef4444" : isSel ? "#a855f7" : "var(--border)",
                  background: showGreen ? "rgba(16,185,129,0.08)" : showRed ? "rgba(239,68,68,0.08)" : isSel ? "rgba(168,85,247,0.08)" : "var(--bg-secondary)",
                  color: "var(--text-primary)",
                }}>
                <span className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: showGreen ? "#10b981" : showRed ? "#ef4444" : isSel ? "#a855f7" : "var(--bg-tertiary)", color: (showGreen || showRed || isSel) ? "white" : "var(--text-secondary)" }}>
                    {["A","B","C","D"][i]}
                  </span>
                  {opt.text}
                  {showGreen && <CheckCircle size={15} className="text-green-500 ml-auto" />}
                  {showRed && <XCircle size={15} className="text-red-500 ml-auto" />}
                </span>
              </button>
            );
          })}
        </div>
        {selected && answers[q?.id] !== q?.correct_option_id && q?.explanation && (
          <div className="mt-4 p-3.5 rounded-xl" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
            <p className="text-sm font-semibold text-yellow-600 mb-1">💡 Tushuntirish</p>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{q.explanation}</p>
          </div>
        )}
      </div>
      {selected && (
        <div className="flex justify-end">
          <button onClick={next} disabled={saving} className="btn-primary">
            {saving && <Loader2 size={16} className="animate-spin" />}
            {current < questions.length - 1 ? "Keyingi" : "Yakunlash"}
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
