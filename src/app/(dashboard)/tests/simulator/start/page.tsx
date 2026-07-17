"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Clock, ChevronLeft, ChevronRight, CheckCircle, XCircle, Flag, AlertCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { shuffleArray } from "@/lib/utils";
import toast from "react-hot-toast";

type Phase = "loading" | "exam" | "result";

export default function SimulatorStartPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [questions, setQuestions] = useState<any[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(90 * 60);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const supabase = createClient();

  const finish = useCallback(async (finalAnswers: Record<string, string>, qList: any[]) => {
    const correct = qList.filter(q => finalAnswers[q.id] === q.correct_option_id).length;
    const score = Math.round((correct / qList.length) * 100);
    const passed = score >= 70;
    if (attemptId) {
      await supabase.from("simulator_attempts").update({
        score: correct, total_questions: qList.length, passed,
        finished_at: new Date().toISOString(), status: "completed",
      }).eq("id", attemptId);
    }
    setPhase("result");
  }, [attemptId, supabase]);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: attempt } = await supabase.from("simulator_attempts")
        .select("*").eq("user_id", user.id).eq("status", "active").single();
      if (!attempt) { router.push("/tests/simulator"); return; }
      setAttemptId(attempt.id);
      const { data: settings } = await supabase.from("settings").select("key, value");
      const s: Record<string, string> = {};
      settings?.forEach((r: any) => { s[r.key] = r.value; });
      const count = Number(s.simulator_questions_count ?? 50);
      const duration = Number(s.simulator_duration_minutes ?? 90);
      setTimeLeft(duration * 60);
      const { data: allQ } = await supabase.from("questions").select("*");
      if (!allQ || allQ.length < 5) { toast.error("Savollar yetarli emas"); router.push("/tests/simulator"); return; }
      const shuffled = shuffleArray(allQ).slice(0, Math.min(count, allQ.length))
        .map((q: any) => ({ ...q, options: shuffleArray(q.options) }));
      setQuestions(shuffled);
      setPhase("exam");
    }
    init();
  }, [router, supabase]);

  useEffect(() => {
    if (phase !== "exam") return;
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(t); toast.error("Vaqt tugadi!"); finish(answers, questions); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [phase, answers, questions, finish]);

  const fmt = (s: number) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const q = questions[current];
  const answered = Object.keys(answers).length;

  if (phase === "loading") return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <Loader2 size={32} className="animate-spin mx-auto mb-3" style={{ color: "#a855f7" }} />
        <p style={{ color: "var(--text-secondary)" }}>Simulyator yuklanmoqda...</p>
      </div>
    </div>
  );

  const correct = questions.filter(q => answers[q.id] === q.correct_option_id).length;
  const score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
  const passed = score >= 70;

  if (phase === "result") return (
    <div className="max-w-2xl mx-auto text-center py-8 animate-fade-in">
      <div className={`w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-5 ${passed ? "bg-green-100 dark:bg-green-900" : "bg-red-100 dark:bg-red-900"}`}>
        {passed ? <CheckCircle size={56} className="text-green-600" /> : <XCircle size={56} className="text-red-500" />}
      </div>
      <h2 className="text-3xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
        {passed ? "Tabriklaymiz! 🎉" : "Yana tayyorlaning"}
      </h2>
      <p className="mb-6" style={{ color: "var(--text-secondary)" }}>
        {passed ? "Attestatsiya simulyatoridan o'tdingiz!" : `O'tish bali 70%. Siz: ${score}%`}
      </p>
      <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto mb-8">
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
      {/* Result breakdown - no AI, just static explanations */}
      <div className="card p-5 text-left mb-6 max-h-80 overflow-y-auto">
        <h3 className="font-bold mb-4" style={{ color: "var(--text-primary)" }}>Noto'g'ri javoblar sharhi</h3>
        {questions.filter(q => answers[q.id] !== q.correct_option_id).map((q) => {
          const correctOpt = q.options.find((o: any) => o.id === q.correct_option_id);
          const selectedOpt = q.options.find((o: any) => o.id === answers[q.id]);
          return (
            <div key={q.id} className="mb-4 pb-4 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
              <p className="text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>{q.text}</p>
              <p className="text-xs text-red-500 flex items-center gap-1"><XCircle size={12} /> {selectedOpt?.text ?? "Javob berilmadi"}</p>
              <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle size={12} /> {correctOpt?.text}</p>
              {q.explanation && <p className="text-xs mt-1.5 italic" style={{ color: "var(--text-tertiary)" }}>💡 {q.explanation}</p>}
            </div>
          );
        })}
        {questions.filter(q => answers[q.id] !== q.correct_option_id).length === 0 && (
          <p className="text-sm text-center py-4 text-green-600">Barcha javoblar to'g'ri! 🎉</p>
        )}
      </div>
      <button onClick={() => router.push("/tests")} className="btn-primary">Testlarga qaytish</button>
    </div>
  );

  return (
    <div className="animate-fade-in">
      {/* Timer bar */}
      <div className="flex items-center justify-between mb-5 p-4 rounded-2xl"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <span className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
          {current + 1}/{questions.length} · {answered} javoblandi
        </span>
        <span className={`font-mono font-bold text-lg px-4 py-1.5 rounded-xl ${timeLeft < 300 ? "text-red-500 bg-red-50 animate-pulse" : "text-purple-600"}`}
          style={timeLeft >= 300 ? { background: "rgba(168,85,247,0.08)" } : {}}>
          <Clock size={16} className="inline mr-1.5" />{fmt(timeLeft)}
        </span>
        <div className="flex items-center gap-2">
          <button onClick={() => setFlagged(p => {
              const n = new Set<string>(Array.from(p));
              if (n.has(q?.id)) { n.delete(q?.id); } else { n.add(q?.id); }
              return n;
            })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${flagged.has(q?.id) ? "text-yellow-600 bg-yellow-50" : ""}`}
            style={!flagged.has(q?.id) ? { background: "var(--bg-secondary)", color: "var(--text-secondary)" } : {}}>
            <Flag size={14} /> Belgi
          </button>
          <button onClick={() => { if (confirm(`${questions.length - answered} ta savol javobsiz. Yakunlash?`)) finish(answers, questions); }}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-red-500 hover:bg-red-600 transition-colors">
            Yakunlash
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Question */}
        <div className="lg:col-span-2">
          <div className="card p-6 mb-4" key={current}>
            {flagged.has(q?.id) && (
              <div className="flex items-center gap-1.5 mb-3 text-yellow-600 text-sm font-medium">
                <Flag size={14} /> Belgilangan savol
              </div>
            )}
            <p className="text-base font-semibold mb-5 leading-relaxed" style={{ color: "var(--text-primary)" }}>
              {q?.text}
            </p>
            <div className="space-y-2.5">
              {q?.options.map((opt: any, i: number) => {
                const sel = answers[q.id] === opt.id;
                return (
                  <button key={opt.id} onClick={() => setAnswers(p => ({ ...p, [q.id]: opt.id }))}
                    className="w-full text-left px-4 py-3.5 rounded-xl border-2 text-sm font-medium transition-all"
                    style={{
                      borderColor: sel ? "#a855f7" : "var(--border)",
                      background: sel ? "rgba(168,85,247,0.08)" : "var(--bg-secondary)",
                      color: "var(--text-primary)",
                    }}>
                    <span className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: sel ? "#a855f7" : "var(--bg-tertiary)", color: sel ? "white" : "var(--text-secondary)" }}>
                        {["A","B","C","D","E"][i]}
                      </span>
                      {opt.text}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex justify-between">
            <button onClick={() => setCurrent(Math.max(0, current - 1))} disabled={current === 0}
              className="btn-secondary disabled:opacity-40"><ChevronLeft size={17} /> Oldingi</button>
            <button onClick={() => setCurrent(Math.min(questions.length - 1, current + 1))} disabled={current === questions.length - 1}
              className="btn-primary disabled:opacity-40">Keyingi <ChevronRight size={17} /></button>
          </div>
        </div>

        {/* Navigator */}
        <div className="card p-4">
          <h3 className="font-bold text-sm mb-3" style={{ color: "var(--text-primary)" }}>Navigator</h3>
          <div className="grid grid-cols-5 gap-1.5 mb-4">
            {questions.map((q, i) => (
              <button key={q.id} onClick={() => setCurrent(i)}
                className="aspect-square rounded-lg text-xs font-bold transition-all"
                style={{
                  background: i === current ? "#a855f7" : answers[q.id] ? "rgba(16,185,129,0.15)" : "var(--bg-secondary)",
                  color: i === current ? "white" : answers[q.id] ? "#10b981" : "var(--text-secondary)",
                  border: flagged.has(q.id) ? "2px solid #f59e0b" : "2px solid transparent",
                }}>
                {i + 1}
              </button>
            ))}
          </div>
          <div className="space-y-1.5 text-xs">
            {[
              { color: "#a855f7", label: "Joriy" },
              { color: "#10b981", label: "Javoblangan" },
              { color: "var(--bg-secondary)", label: "Javoblanmagan" },
              { color: "#f59e0b", label: "Belgilangan" },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-2" style={{ color: "var(--text-tertiary)" }}>
                <span className="w-4 h-4 rounded" style={{ background: l.color, flexShrink: 0 }} />{l.label}
              </div>
            ))}
          </div>
          {answered < questions.length && (
            <div className="mt-3 p-2.5 rounded-xl flex items-start gap-2"
              style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <AlertCircle size={13} className="text-yellow-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-yellow-700 dark:text-yellow-400">
                {questions.length - answered} ta savol javoblanmagan
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
