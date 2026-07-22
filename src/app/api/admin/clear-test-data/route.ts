import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId kerak" }, { status: 400 });

  const supabase = await createAdminClient();
  await supabase.from("simulator_attempts").delete().eq("user_id", userId);
  await supabase.from("payments").delete().eq("user_id", userId);

  return NextResponse.json({ ok: true });
}