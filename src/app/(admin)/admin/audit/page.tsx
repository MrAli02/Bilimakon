import { createClient } from "@/lib/supabase/server";
import { Shield, LogIn, Key, Ban, CheckCircle, AlertTriangle, User } from "lucide-react";

const ACTION_META: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  admin_login:      { label: "Admin kirdi",        icon: LogIn,        color: "#a855f7", bg: "rgba(168,85,247,0.1)" },
  user_blocked:     { label: "Foydalanuvchi blok", icon: Ban,          color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
  user_unblocked:   { label: "Blok ochildi",       icon: CheckCircle,  color: "#10b981", bg: "rgba(16,185,129,0.1)" },
  key_created:      { label: "Kalit yaratildi",    icon: Key,          color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  key_activated:    { label: "Kalit faollashdi",   icon: Key,          color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
  device_blocked:   { label: "Qurilma blok",       icon: AlertTriangle,color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
  login_attempt:    { label: "Kirish urinishi",    icon: User,         color: "#6b7280", bg: "rgba(107,114,128,0.1)" },
};

export default async function AuditLogsPage() {
  const supabase = await createClient();

  const { data: logs } = await supabase
    .from("audit_logs")
    .select("*, profiles(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
          Audit Loglari
        </h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Barcha muhim amallar tarixi
        </p>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between"
          style={{ borderColor: "var(--border)" }}>
          <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
            So&apos;nggi {logs?.length ?? 0} ta amal
          </span>
          <span className="badge-blue text-xs">Real vaqt</span>
        </div>

        {(!logs || logs.length === 0) ? (
          <div className="p-12 text-center">
            <Shield size={36} className="mx-auto mb-3" style={{ color: "var(--text-tertiary)" }} />
            <p style={{ color: "var(--text-secondary)" }}>Hali loglar yo&apos;q</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {logs.map((log: any) => {
              const meta = ACTION_META[log.action] ?? {
                label: log.action,
                icon: Shield,
                color: "#6b7280",
                bg: "rgba(107,114,128,0.1)",
              };
              const Icon = meta.icon;
              return (
                <div key={log.id}
                  className="flex items-start gap-4 px-5 py-3.5 hover:bg-[var(--bg-secondary)] transition-colors">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: meta.bg }}>
                    <Icon size={15} style={{ color: meta.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                        {meta.label}
                      </span>
                      <span className={`badge ${log.success ? "badge-green" : "badge-red"} text-xs`}>
                        {log.success ? "Muvaffaqiyatli" : "Muvaffaqiyatsiz"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap text-xs"
                      style={{ color: "var(--text-tertiary)" }}>
                      {(log as any).profiles?.full_name && (
                        <span>👤 {(log as any).profiles.full_name}</span>
                      )}
                      {log.ip_address && <span>🌐 {log.ip_address}</span>}
                      {log.details?.email && <span>📧 {log.details.email}</span>}
                    </div>
                  </div>
                  <div className="text-xs flex-shrink-0" style={{ color: "var(--text-tertiary)" }}>
                    {new Date(log.created_at).toLocaleString("uz-UZ")}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
