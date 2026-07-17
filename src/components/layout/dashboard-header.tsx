"use client";
import { Sun, Moon, Bell } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import type { Profile } from "@/types";

export default function DashboardHeader({ profile }: { profile: Profile | null }) {
  const { theme, setTheme } = useTheme();
  return (
    <header className="sticky top-0 z-20 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b"
      style={{ background: "var(--surface-overlay)", backdropFilter: "blur(12px)", borderColor: "var(--border)" }}>
      <div className="w-10 lg:hidden" />
      <div className="hidden lg:block" />
      <div className="flex items-center gap-2 ml-auto">
        <button className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-[var(--bg-secondary)] relative"
          style={{ color: "var(--text-secondary)" }}>
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: "#a855f7" }} />
        </button>
        <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-[var(--bg-secondary)]"
          style={{ color: "var(--text-secondary)" }}>
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <Link href="/profile">
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white cursor-pointer"
            style={{ background: "linear-gradient(135deg,#a855f7,#ec4899)" }}>
            {profile?.full_name?.[0] ?? "U"}
          </div>
        </Link>
      </div>
    </header>
  );
}
