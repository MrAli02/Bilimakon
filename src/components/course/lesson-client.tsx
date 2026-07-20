"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, Loader2, Play } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import RestrictedPlayer from "./restricted-player";
import { shuffleArray } from "@/lib/utils";
import toast from "react-hot-toast";
import type { Question } from "@/types";

interface LessonInfo {
  id: string;
  module_id: string;
  title: string;
  description?: string;
  youtube_video_id?: string;
}

interface ProfileInfo {
  id: string;
  full_name: string;
}

interface NextLessonInfo {
  id: string;
  title: string;
}

interface Props {
  lesson: LessonInfo;
  questions: Question[];
  initialProgress: { quiz_passed?: boolean } | null;
  profile: ProfileInfo | null;
  courseId: string;
  nextLesson: NextLessonInfo | null;
  userId: string;
}

type Phase = "video" | "quiz" | "result";

export default function LessonClient({ lesson, questions, initialProgress, profile, courseId, nextLesson, userId }: Props) {
  const [phase, setPhase] = useState<Phase>(initialProgress?.quiz_passed ? "result" : "video");
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [videoWatchedFraction, setVideoWatchedFraction] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  function startQuiz() {
    const shuffled = shuffleArray(questions)
      .slice(0, Math.min(10, questions.length))
      .map((q) => ({ ...q, options: shuffleArray(q.options) }));
    setQuizQuestions(shuffled);
    setCurrentQ(0);
    setAnswers({});
setSelectedOption(null);
    setRevealed(false);
    setPhase("quiz");
  }

function selectAnswer(optionId: string) {
    if (revealed) return;
    setSelectedOption(optionId);
    setAnswers(prev => ({ ...prev, [quizQuestions[currentQ].id]: optionId }));
  }

  function confirmAnswer() {
    if (!selectedOption) return;
    setRevealed(true);
  }

function nextQuestion() {
    if (currentQ < quizQuestions.length - 1) {
      setCurrentQ(currentQ + 1);
      setSelectedOption(null);
      setRevealed(false);
    } else {
      finishQuiz();
    }
  }

  async function finishQuiz() {
    const correct = quizQuestions.filter(q => answers[q.id] === q.correct_option_id).length;
    const score = Math.round((correct / quizQuestions.length) * 100);
    const passed = score >= 60;
    setSaving(true);
    try {
      await supabase.from("lesson_progress").upsert({
        user_id: userId,
        lesson_id: lesson.id,
        is_completed: passed,
        quiz_passed: passed,
        quiz_score: score,
        completed_at: passed ? new Date().toISOString() : null,
        watched_seconds: 0,
      }, { onConflict: "user_id,lesson_id" });

      if (passed) {
        toast.success("Dars muvaffaqiyatli bajarildi! 🎉");
        // Update enrollment progress
        await fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courseId, lessonId: lesson.id, isCompleted: true }),
        });
      }
    } catch (e) { console.error(e); }
    finally { setSaving(false); setPhase("result"); }
  }

  const q = quizQuestions[currentQ];
  const correct = quizQuestions.filter(q => answers[q.id] === q.correct_option_id).length;
  const score = quizQuestions.length > 0 ? Math.round((correct / quizQuestions.length) * 100) : 0;
  const quizPassed = score >= 60 || initialProgress?.quiz_passed;

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-5" style={{ color: "var(--text-tertiary)" }}>
        <Link href={`/courses/${courseId}`} className="flex items-center gap-1 hover:text-purple-600 transition-colors">
          <ChevronLeft size={15} /> Kursga qaytish
        </Link>
        <span>/</span>
        <span className="truncate max-w-xs" style={{ color: "var(--text-primary)" }}>{lesson.title}</span>
      </div>

      {/* VIDEO */}
      {phase === "video" && (
        <div>
          <h1 className="text-xl font-bold mb-5" style={{ color: "var(--text-primary)" }}>{lesson.title}</h1>
{lesson.youtube_video_id ? (
            <div className="relative mb-5">
              <RestrictedPlayer videoId={lesson.youtube_video_id} title={lesson.title} onProgress={setVideoWatchedFraction} />
              {/* Watermark */}
              <div className="video-watermark" style={{ position: "absolute", pointerEvents: "none", userSelect: "none" }}>
                {profile?.full_name} · {profile?.id?.slice(0, 8)}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl flex items-center justify-center mb-5"
              style={{ aspectRatio: "16/9", background: "var(--bg-secondary)", border: "1.5px dashed var(--border)" }}>
              <div className="text-center">
                <Play size={36} className="mx-auto mb-2" style={{ color: "var(--text-tertiary)" }} />
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Video qo'shilmagan</p>
              </div>
            </div>
          )}

          {lesson.description && (
            <div className="card p-5 mb-5">
              <h2 className="font-bold mb-2" style={{ color: "var(--text-primary)" }}>Dars haqida</h2>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{lesson.description}</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <Link href={`/courses/${courseId}`} className="btn-secondary">
              <ChevronLeft size={16} /> Ortga
            </Link>
            {questions.length > 0 ? (
              <button onClick={startQuiz} disabled={!!lesson.youtube_video_id && videoWatchedFraction < 0.8} className="btn-primary">
                {!!lesson.youtube_video_id && videoWatchedFraction < 0.8
                  ? `Videoni ko'ring (${Math.round(videoWatchedFraction * 100)}%)`
                  : "Quizni boshlash"} <ChevronRight size={16} />
              </button>
            ) : (!!lesson.youtube_video_id && videoWatchedFraction < 0.8) ? (
              <button disabled className="btn-primary opacity-50 cursor-not-allowed">
                {`Videoni ko'ring (${Math.round(videoWatchedFraction * 100)}%)`} <ChevronRight size={16} />
              </button>
            ) : nextLesson ? (
              <Link href={`/courses/${courseId}/lessons/${nextLesson.id}`} className="btn-primary">
                Keyingi dars <ChevronRight size={16} />
              </Link>
            ) : (
              <Link href={`/courses/${courseId}`} className="btn-primary">
                Kursga qaytish <ChevronRight size={16} />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* QUIZ */}
      {phase === "quiz" && q && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold" style={{ color: "var(--text-primary)" }}>Quiz</h2>
            <span className="badge-blue">{currentQ + 1} / {quizQuestions.length}</span>
          </div>
          <div className="progress-bar mb-5">
            <div className="progress-fill" style={{ width: `${((currentQ + 1) / quizQuestions.length) * 100}%` }} />
          </div>

          <div className="card p-6 mb-4">
            <p className="text-base font-semibold mb-5 leading-relaxed" style={{ color: "var(--text-primary)" }}>
              {q.text}
            </p>
            <div className="space-y-2.5">
              {q.options.map((opt: { id: string; text: string }, idx: number) => {
                const isSel = selectedOption === opt.id;
                const isCorrect = opt.id === q.correct_option_id;
const showGreen = revealed && isCorrect;
                const showRed = revealed && isSel && !isCorrect;
                return (
                  <button key={opt.id} onClick={() => selectAnswer(opt.id)} 
                    className="w-full text-left px-4 py-3.5 rounded-xl border-2 text-sm font-medium transition-all"
                    style={{
                      borderColor: showGreen ? "#10b981" : showRed ? "#ef4444" : isSel ? "#a855f7" : "var(--border)",
                      background: showGreen ? "rgba(16,185,129,0.08)" : showRed ? "rgba(239,68,68,0.08)" : isSel ? "rgba(168,85,247,0.08)" : "var(--bg-secondary)",
                      color: "var(--text-primary)",
                    }}>
                    <span className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{
                          background: showGreen ? "#10b981" : showRed ? "#ef4444" : isSel ? "#a855f7" : "var(--bg-tertiary)",
                          color: (showGreen || showRed || isSel) ? "white" : "var(--text-secondary)",
                        }}>
                        {["A","B","C","D"][idx]}
                      </span>
                      <span className="flex-1">{opt.text}</span>
                      {showGreen && <CheckCircle size={15} className="text-green-500 flex-shrink-0" />}
                      {showRed && <XCircle size={15} className="text-red-500 flex-shrink-0" />}
                    </span>
                  </button>
                );
              })}
            </div>
            {/* Static explanation — no AI */}
            {revealed && answers[q.id] !== q.correct_option_id && q.explanation && (
              <div className="mt-4 p-4 rounded-xl" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)" }}>
                <p className="text-sm font-semibold text-yellow-600 mb-1">💡 Tushuntirish</p>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{q.explanation}</p>
              </div>
            )}
          </div>

{selectedOption && !revealed && (
            <div className="flex justify-end">
              <button onClick={confirmAnswer} className="btn-primary">
                Javobni tasdiqlash <ChevronRight size={16} />
              </button>
            </div>
          )}
          {revealed && (
            <div className="flex justify-end">
              <button onClick={nextQuestion} disabled={saving} className="btn-primary">
                {saving && <Loader2 size={16} className="animate-spin" />}
                {currentQ < quizQuestions.length - 1 ? "Keyingi savol" : "Natijani ko'rish"}
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* RESULT */}
      {phase === "result" && (
        <div className="text-center py-6">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-5 ${quizPassed ? "bg-green-100 dark:bg-green-900" : "bg-red-100 dark:bg-red-900"}`}>
            {quizPassed ? <CheckCircle size={48} className="text-green-600" /> : <XCircle size={48} className="text-red-500" />}
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
            {quizPassed ? "Barakalla! 🎉" : "Yana urinib ko'ring"}
          </h2>
          {quizQuestions.length > 0 && (
            <p className="text-lg mb-2" style={{ color: "var(--text-secondary)" }}>
              {correct}/{quizQuestions.length} to'g'ri · {score}%
            </p>
          )}
          <p className="mb-7 text-sm" style={{ color: "var(--text-tertiary)" }}>
            {quizPassed ? "Keyingi darsga o'tishingiz mumkin." : "O'tish bali: 60%. Qayta urinib ko'ring."}
          </p>

          {/* Incorrect answers breakdown */}
          {quizQuestions.length > 0 && quizQuestions.some(q => answers[q.id] !== q.correct_option_id) && (
            <div className="card p-5 text-left mb-6 max-h-64 overflow-y-auto">
              <p className="font-bold text-sm mb-3" style={{ color: "var(--text-primary)" }}>Noto'g'ri javoblar:</p>
              {quizQuestions.filter(q => answers[q.id] !== q.correct_option_id).map((q) => {
                const correctOpt = q.options.find((o: { id: string; text: string }) => o.id === q.correct_option_id);
                const selectedOpt = q.options.find((o: { id: string; text: string }) => o.id === answers[q.id]);
                return (
                  <div key={q.id} className="mb-3 pb-3 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                    <p className="text-xs font-medium mb-1" style={{ color: "var(--text-primary)" }}>{q.text}</p>
                    <p className="text-xs text-red-500">✗ {selectedOpt?.text ?? "Javob berilmadi"}</p>
                    <p className="text-xs text-green-600">✓ {correctOpt?.text}</p>
                    {q.explanation && <p className="text-xs italic mt-1" style={{ color: "var(--text-tertiary)" }}>💡 {q.explanation}</p>}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-center gap-3 flex-wrap">
            {!quizPassed && questions.length > 0 && (
              <button onClick={startQuiz} className="btn-secondary">Qayta urinish</button>
            )}
            {nextLesson && quizPassed && (
              <Link href={`/courses/${courseId}/lessons/${nextLesson.id}`} className="btn-primary">
                Keyingi dars <ChevronRight size={16} />
              </Link>
            )}
            <Link href={`/courses/${courseId}`} className="btn-secondary">
              <ChevronLeft size={16} /> Kursga qaytish
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
