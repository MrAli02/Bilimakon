import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { checkRateLimit, recordFailedAttempt, clearAttempts } from "@/lib/security";
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? req.headers.get("x-real-ip") ?? "unknown";
  const id = `admin_login:${ip}`;
  const rate = checkRateLimit(id, true);
  if (!rate.allowed) {
    return NextResponse.json({ error: rate.message, blockedUntil: rate.blockedUntil }, { status: 429 });
  }
  try {
    const { email, password, adminSecret } = await req.json();
    if (!email || !password) {
      recordFailedAttempt(id, true);
      return NextResponse.json({ error: "Email va parol kiritilishi shart" }, { status: 400 });
    }
    const envSecret = process.env.ADMIN_SECRET_KEY;
    if (envSecret && adminSecret !== envSecret) {
      recordFailedAttempt(id, true);
      const newRate = checkRateLimit(id, true);
      return NextResponse.json({ error: "Admin maxfiy kalit noto'g'ri", remainingAttempts: newRate.remainingAttempts }, { status: 403 });
    }
    const supabase = await createAdminClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      recordFailedAttempt(id, true);
      const newRate = checkRateLimit(id, true);
      return NextResponse.json({ error: "Email yoki parol noto'g'ri", remainingAttempts: newRate.remainingAttempts }, { status: 401 });
    }
    const { data: profile } = await supabase.from("profiles").select("role, is_blocked, full_name").eq("id", data.user.id).single();
    if (!profile || profile.role !== "admin") {
      recordFailedAttempt(id, true);
      await supabase.auth.signOut();
      return NextResponse.json({ error: "Bu hisob admin emas" }, { status: 403 });
    }
    if (profile.is_blocked) {
      await supabase.auth.signOut();
      return NextResponse.json({ error: "Akkaunt bloklangan" }, { status: 403 });
    }
    clearAttempts(id);
    try {
      await supabase.from("audit_logs").insert({
        action: "admin_login",
        user_id: data.user.id,
        ip_address: ip,
        details: { email, user_agent: req.headers.get("user-agent")?.substring(0, 150) },
        success: true,
      });
    } catch {
      // audit log xatosi asosiy jarayonni to'xtatmasin
    }
    return NextResponse.json({ success: true, userId: data.user.id, name: profile.full_name });
  } catch {
    recordFailedAttempt(id, true);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}