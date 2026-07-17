import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/admin-sidebar";
import DashboardHeader from "@/components/layout/dashboard-header";

export const metadata = { title: "Admin Panel — BilimMakon" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/admin-login");

  const { data: profile } = await supabase
    .from("profiles").select("*").eq("id", user.id).single();

  if (!profile || profile.role !== "admin") redirect("/login");

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
      <AdminSidebar profile={profile} />
      <div className="flex-1 flex flex-col min-w-0 lg:ml-60">
        <DashboardHeader profile={profile} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
