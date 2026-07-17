import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ allowed: false, reason: "unauthenticated" }, { status: 401 });

    const { fingerprint, deviceInfo } = await req.json();
    const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? null;

    const { data } = await supabase.rpc("check_device_limit", {
      p_user_id: user.id,
      p_fingerprint: fingerprint,
      p_device_info: deviceInfo ?? null,
      p_ip: ip,
    });

    return NextResponse.json(data ?? { allowed: false, reason: "error" });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server xatosi";
    return NextResponse.json({ allowed: false, reason: message }, { status: 500 });
  }
}
