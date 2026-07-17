import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardSidebar from "@/components/layout/dashboard-sidebar";
import DashboardHeader from "@/components/layout/dashboard-header";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect("/login");
  if (profile.is_blocked) redirect("/login?blocked=1");
  if (profile.role === "admin") redirect("/admin");
  if (!profile.access_key_id) redirect("/activate");

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
      <DashboardSidebar profile={profile} />
      <div className="flex-1 flex flex-col min-w-0 lg:ml-60">
        <DashboardHeader profile={profile} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
