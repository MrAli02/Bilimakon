"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, GraduationCap, HelpCircle,
  CreditCard, BarChart3, Settings, LogOut, ChevronRight, Megaphone,
  Shield, Key, FileText, Menu, X, ClipboardList
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Profile } from "@/types";

const NAV_GROUPS = [
  {
    label: "Asosiy",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/admin/analytics", label: "Statistika", icon: BarChart3 },
    ],
  },
  {
    label: "Foydalanuvchilar",
    items: [
      { href: "/admin/users", label: "Foydalanuvchilar", icon: Users },
      { href: "/admin/keys", label: "Kirish Kalitlari", icon: Key },
    ],
  },
  {
    label: "Kontent",
    items: [
      { href: "/admin/courses", label: "Kurslar", icon: GraduationCap },
      { href: "/admin/materials", label: "Materiallar (PDF)", icon: FileText },
      { href: "/admin/questions", label: "Savollar banki", icon: HelpCircle },
    ],
  },
  {
    label: "Moliya",
    items: [
      { href: "/admin/payments", label: "To'lovlar", icon: CreditCard },
    ],
  },
  {
    label: "Tizim",
    items: [
      { href: "/admin/announcements", label: "E'lonlar", icon: Megaphone },
      { href: "/admin/audit", label: "Audit Loglari", icon: ClipboardList },
      { href: "/admin/settings", label: "Sozlamalar", icon: Settings },
    ],
  },
];

function SidebarContent({ profile, onClose }: { profile: Profile | null; onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin-login");
    router.refresh();
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b flex items-center justify-between"
        style={{ borderColor: "var(--border)" }}>
        <Link href="/admin" className="flex items-center gap-2.5" onClick={onClose}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#a855f7,#7c3aed)" }}>
            <Shield size={16} className="text-white" />
          </div>
          <div>
            <span className="font-bold text-sm block" style={{ color: "var(--text-primary)" }}>
              BilimMakon
            </span>
            <span className="text-xs font-semibold" style={{ color: "#a855f7" }}>
              Admin Panel
            </span>
          </div>
        </Link>
        {onClose && (
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--bg-secondary)]"
            style={{ color: "var(--text-secondary)" }}>
            <X size={15} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 overflow-y-auto space-y-4">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            <p className="text-xs font-bold uppercase tracking-widest px-3 mb-1"
              style={{ color: "var(--text-tertiary)" }}>
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(item => {
                const active = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                return (
                  <Link key={item.href} href={item.href} onClick={onClose}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150"
                    style={active ? {
                      background: "linear-gradient(135deg,rgba(168,85,247,0.15),rgba(124,58,237,0.1))",
                      color: "#a855f7",
                      borderLeft: "3px solid #a855f7",
                    } : {
                      color: "var(--text-secondary)",
                    }}
                    onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "var(--bg-secondary)"; }}
                    onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = ""; }}>
                    <item.icon size={16} />
                    <span className="flex-1">{item.label}</span>
                    {active && <ChevronRight size={13} />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-1"
          style={{ background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.1)" }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#a855f7,#ec4899)" }}>
            {profile?.full_name?.[0] ?? "A"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
              {profile?.full_name ?? "Admin"}
            </div>
            <div className="text-xs font-medium" style={{ color: "#a855f7" }}>Administrator</div>
          </div>
        </div>
        <button onClick={handleLogout}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium w-full transition-all text-red-500 hover:bg-red-50 dark:hover:bg-red-950">
          <LogOut size={16} /> Chiqish
        </button>
      </div>
    </div>
  );
}

export default function AdminSidebar({ profile }: { profile: Profile | null }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-60 flex-col border-r z-30"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <SidebarContent profile={profile} />
      </aside>

      {/* Mobile trigger */}
      <button onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
        <Menu size={18} />
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)} />
          <aside className="lg:hidden fixed inset-y-0 left-0 w-64 z-50 flex flex-col"
            style={{ background: "var(--surface)" }}>
            <SidebarContent profile={profile} onClose={() => setMobileOpen(false)} />
          </aside>
        </>
      )}
    </>
  );
}
