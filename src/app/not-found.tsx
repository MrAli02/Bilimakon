import Link from "next/link";
import { Home } from "lucide-react";
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background:"linear-gradient(135deg,#fce7ff,#ede9fe)" }}>
      <div className="text-center">
        <div className="text-9xl font-bold mb-4"
          style={{ background:"linear-gradient(135deg,#a855f7,#7c3aed)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
          404
        </div>
        <h1 className="text-2xl font-bold mb-3" style={{ color:"#1a1a2e" }}>Sahifa topilmadi</h1>
        <p className="mb-7" style={{ color:"#6b6b8f" }}>Siz qidirgan sahifa mavjud emas.</p>
        <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm text-white"
          style={{ background:"linear-gradient(135deg,#a855f7,#7c3aed)" }}>
          <Home size={17} /> Bosh sahifaga
        </Link>
      </div>
    </div>
  );
}
