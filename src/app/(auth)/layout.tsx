import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>
      {/* Left – form */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 sm:px-10 lg:px-16 py-12">
        <div className="w-full max-w-md">
          <Link href="/" className="flex items-center gap-2.5 mb-10">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #a855f7, #7c3aed)" }}>
              <BookOpen size={18} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-lg block" style={{ color: "var(--text-primary)" }}>BilimMakon</span>
              <span className="text-xs font-semibold" style={{ color: "#a855f7" }}>Milliy Akademiya</span>
            </div>
          </Link>
          {children}
        </div>
      </div>

      {/* Right – illustration */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #a855f7 0%, #7c3aed 50%, #6d28d9 100%)" }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="relative text-center text-white max-w-md z-10">
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8"
            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}>
            <BookOpen size={48} className="text-white" />
          </div>
          <h2 className="text-4xl font-extrabold mb-4">O&apos;rganish — eng yaxshi investitsiya</h2>
          <p className="text-purple-100 text-lg leading-relaxed mb-10">
            BilimMakon bilan attestatsiyaga professional darajada tayyorlaning.
          </p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { v: "500+", l: "O'qituvchi" },
              { v: "98%", l: "O'tish darajasi" },
              { v: "24/7", l: "AI Yordam" },
            ].map(s => (
              <div key={s.l} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.1)" }}>
                <div className="text-2xl font-bold mb-1">{s.v}</div>
                <div className="text-sm text-purple-200">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
