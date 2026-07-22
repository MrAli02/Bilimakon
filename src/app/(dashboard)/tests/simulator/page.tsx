import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Award, Clock, Shield } from "lucide-react";
import SimulatorGate from "@/components/course/simulator-gate";

export default async function SimulatorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: activeAttempt } = await supabase
    .from("simulator_attempts")
    .select("id, started_at")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  const { data: confirmedPayment } = await supabase
    .from("payments")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "confirmed")
    .eq("used", false)
    .limit(1)
    .maybeSingle(); 
    
    const { data: settingsRows } = await supabase.from("settings").select("key, value");
  const settings: Record<string, string> = {};
  settingsRows?.forEach((r: { key: string; value: string }) => { settings[r.key] = r.value; });

  const price = Number(settings.simulator_price ?? 50000);
  const enabled = settings.simulator_enabled !== "false";

  const { data: pastAttempts } = await supabase
    .from("simulator_attempts")
    .select("score, total_questions, passed, finished_at")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("finished_at", { ascending: false })
    .limit(5);

  if (!enabled) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="card p-10 text-center max-w-md">
          <Shield size={40} className="mx-auto mb-4" style={{ color: "var(--text-tertiary)" }} />
          <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Simulyator vaqtincha yopiq</h2>
          <p style={{ color: "var(--text-secondary)" }}>Admin simulyatorni yoqishi kutilmoqda.</p>
        </div>
      </div>
    );
  }

  const infoCards = [
    { icon: Shield, label: "Savollar", value: settings.simulator_questions_count ?? "50", color: "rgba(168,85,247,0.1)", ic: "#a855f7" },
    { icon: Clock, label: "Vaqt", value: `${settings.simulator_duration_minutes ?? 90} daq`, color: "rgba(59,130,246,0.1)", ic: "#3b82f6" },
    { icon: Award, label: "O'tish bali", value: `${settings.simulator_passing_score ?? 70}%`, color: "rgba(16,185,129,0.1)", ic: "#10b981" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>Attestatsiya Simulyatori</h1>
        <p style={{ color: "var(--text-secondary)" }}>Haqiqiy attestatsiya kabi tayyorlanish</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {infoCards.map((card) => (
          <div key={card.label} className="card p-4 text-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: card.color }}>
              <card.icon size={19} style={{ color: card.ic }} />
            </div>
            <div className="text-xl font-bold mb-0.5" style={{ color: "var(--text-primary)" }}>{card.value}</div>
            <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{card.label}</div>
          </div>
        ))}
      </div>

      <SimulatorGate activeAttempt={activeAttempt} price={price} hasConfirmedPayment={!!confirmedPayment} />

      {pastAttempts && pastAttempts.length > 0 && (
        <div>
          <h2 className="font-bold mb-3" style={{ color: "var(--text-primary)" }}>O'tgan urinishlar</h2>
          <div className="space-y-2">
            {pastAttempts.map((a, i) => (
              <div key={i} className="card p-4 flex items-center justify-between">
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  {new Date(a.finished_at).toLocaleDateString("uz-UZ")}
                </span>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm" style={{ color: a.passed ? "#10b981" : "#ef4444" }}>
                    {a.score}/{a.total_questions} — {Math.round((a.score / a.total_questions) * 100)}%
                  </span>
                  <span className={`badge ${a.passed ? "badge-green" : "badge-red"}`}>
                    {a.passed ? "O'tdi" : "O'tmadi"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
