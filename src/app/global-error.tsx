"use client";
import { RefreshCw } from "lucide-react";
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html><body style={{ background:"#0d0d14", display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", fontFamily:"system-ui" }}>
      <div style={{ textAlign:"center", maxWidth:"400px", padding:"2rem" }}>
        <h1 style={{ color:"#f0f0ff", fontSize:"1.5rem", fontWeight:"bold", marginBottom:"1rem" }}>Xatolik yuz berdi</h1>
        <p style={{ color:"#9898bb", marginBottom:"1.5rem" }}>Kutilmagan xatolik. Qayta urinib ko'ring.</p>
        <button onClick={reset} style={{ display:"inline-flex", alignItems:"center", gap:"8px", padding:"10px 24px", borderRadius:"12px", background:"linear-gradient(135deg,#a855f7,#7c3aed)", color:"white", fontWeight:"600", border:"none", cursor:"pointer" }}>
          <RefreshCw size={16} /> Qayta urinish
        </button>
      </div>
    </body></html>
  );
}
