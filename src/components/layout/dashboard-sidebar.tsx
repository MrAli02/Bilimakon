"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, LayoutDashboard, ClipboardList, TrendingUp, User, LogOut, Menu, X, Brain } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Profile } from "@/types";

const NAV = [
  { href: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard, exact: true },
  { href: "/courses",    label: "Kurslar",     icon: BookOpen },
  { href: "/tests",      label: "Testlar",     icon: ClipboardList },
  { href: "/progress",   label: "Progress",    icon: TrendingUp },
  { href: "/profile",    label: "Profil",      icon: User },
];

function SidebarContent({ profile, onClose }: { profile: Profile | null; onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
        <Link href="/dashboard" onClick={onClose} className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#a855f7,#7c3aed)" }}>
            <BookOpen size={16} className="text-white" />
          </div>
          <div>
            <span className="font-bold text-sm block" style={{ color: "var(--text-primary)" }}>BilimMakon</span>
            <span className="text-xs" style={{ color: "#a855f7" }}>Shaxsiy kabinet</span>
          </div>
        </Link>
        {onClose && (
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ color: "var(--text-secondary)" }}><X size={15} /></button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.map(item => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} onClick={onClose}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={active
                ? { background: "linear-gradient(135deg,rgba(168,85,247,0.15),rgba(124,58,237,0.1))", color: "#a855f7", borderLeft: "3px solid #a855f7" }
                : { color: "var(--text-secondary)" }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "var(--bg-secondary)"; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = ""; }}>
              <item.icon size={17} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1"
          style={{ background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.1)" }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#a855f7,#ec4899)" }}>
            {profile?.full_name?.[0] ?? "U"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{profile?.full_name}</div>
            <div className="text-xs truncate" style={{ color: "var(--text-tertiary)" }}>{profile?.email}</div>
          </div>
        </div>
        <button onClick={logout}
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium w-full text-red-500 transition-all hover:bg-red-50 dark:hover:bg-red-950">
          <LogOut size={16} /> Chiqish
        </button>
      </div>
    </div>
  );
}

export default function DashboardSidebar({ profile }: { profile: Profile | null }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-60 flex-col border-r z-30"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <SidebarContent profile={profile} />
      </aside>
      <button onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
        <Menu size={18} />
      </button>
      {open && (
        <>
          <div className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="lg:hidden fixed inset-y-0 left-0 w-64 z-50 flex flex-col" style={{ background: "var(--surface)" }}>
            <SidebarContent profile={profile} onClose={() => setOpen(false)} />
          </aside>
        </>
      )}
    </>
  );
}
