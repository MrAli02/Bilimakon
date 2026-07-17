import Link from "next/link";
import Image from "next/image";
import { BookOpen, Award, Users, ChevronRight, Star, Brain, Play, GraduationCap, Sparkles, ClipboardList } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: "#fff" }}>
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-4 sm:px-8"
        style={{ background:"rgba(255,255,255,0.9)", backdropFilter:"blur(16px)", borderBottom:"1px solid rgba(168,85,247,0.1)" }}>
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background:"linear-gradient(135deg,#a855f7,#7c3aed)" }}>
              <BookOpen size={18} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-lg block" style={{ color:"#1a1a2e" }}>BilimMakon</span>
              <span className="text-xs font-semibold" style={{ color:"#a855f7" }}>Milliy Akademiya</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-1">
            {[
              { label:"Bosh Sahifa", href:"/" },
              { label:"Video Darslar", href:"/courses" },
              { label:"Testlar", href:"/tests" },
              { label:"AI Mentor", href:"/ai-mentor" },
            ].map(item => (
              <Link key={item.href} href={item.href}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-purple-50"
                style={{ color:"#4a4a6a" }}>
                {item.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login"
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 hover:scale-105"
              style={{ background:"linear-gradient(135deg,#a855f7,#7c3aed)" }}>
              Kirish
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="min-h-screen pt-16 relative overflow-hidden flex items-center"
        style={{ background:"linear-gradient(135deg,#fce7ff 0%,#f3e8ff 30%,#ede9fe 60%,#fdf2ff 100%)" }}>
        <div className="absolute top-20 left-10 w-80 h-80 rounded-full pointer-events-none"
          style={{ background:"radial-gradient(circle,rgba(168,85,247,0.14) 0%,transparent 70%)" }} />
        <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full pointer-events-none"
          style={{ background:"radial-gradient(circle,rgba(236,72,153,0.1) 0%,transparent 70%)" }} />
        <div className="absolute inset-0 pointer-events-none opacity-20"
          style={{ backgroundImage:"radial-gradient(circle,rgba(168,85,247,0.2) 1px,transparent 1px)", backgroundSize:"32px 32px" }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-8 w-full py-8">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6"
                style={{ background:"rgba(168,85,247,0.08)", color:"#7c3aed", border:"1px solid rgba(168,85,247,0.2)" }}>
                <Sparkles size={14} /> O&apos;qish — kelajak sari eng yaxshi qadam!
              </div>
              <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight mb-5">
                <span style={{ background:"linear-gradient(90deg,#f97316,#ec4899)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Bilim oling</span>
                <span style={{ color:"#1a1a2e" }}>, </span>
                <span style={{ background:"linear-gradient(90deg,#a855f7,#ec4899)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>rivojlaning</span>
                <span style={{ color:"#1a1a2e" }}>,</span><br />
                <span style={{ background:"linear-gradient(90deg,#3b82f6,#8b5cf6)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>maqsadga</span>
                <span className="font-extrabold" style={{ color:"#1a1a2e" }}> erishing!</span>
              </h1>
              <p className="text-base mb-8 leading-relaxed" style={{ color:"#6b6b8f" }}>
                <span className="font-bold" style={{ color:"#a855f7" }}>BilimMakon</span> — zamonaviy ta&apos;lim platformasi.
                Video darslar, AI Mentor, attestatsiya simulyatori va boshqa imkoniyatlar siz uchun!
              </p>
              <div className="flex flex-wrap gap-3 mb-8">
                <Link href="/register"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-sm text-white transition-all hover:scale-105"
                  style={{ background:"linear-gradient(135deg,#ec4899,#a855f7)", boxShadow:"0 4px 20px rgba(168,85,247,0.4)" }}>
                  <Users size={18} /> Ro&apos;yxatdan o&apos;tish
                </Link>
                <Link href="/login"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-sm transition-all hover:scale-105"
                  style={{ background:"rgba(124,58,237,0.1)", color:"#7c3aed", border:"1.5px solid rgba(124,58,237,0.3)" }}>
                  <ChevronRight size={18} /> Kirish
                </Link>
              </div>
              {/* Premium card */}
              <div className="rounded-2xl p-5"
                style={{ background:"rgba(255,255,255,0.75)", border:"1px solid rgba(168,85,247,0.15)", backdropFilter:"blur(10px)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Award size={16} style={{ color:"#a855f7" }} />
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color:"#a855f7" }}>Premium Imkoniyat</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-base mb-1" style={{ color:"#1a1a2e" }}>Attestatsiya ehtimoliy testlari</h3>
                    <p className="text-sm" style={{ color:"#6b6b8f" }}>
                      Attestatsiya standartlari asosida tuzilgan testlar, vaqt tahlili va batafsil natijalar.
                    </p>
                  </div>
                  <Link href="/register"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white flex-shrink-0 transition-all hover:scale-105"
                    style={{ background:"linear-gradient(135deg,#a855f7,#7c3aed)" }}>
                    <Play size={15} fill="white" /> Boshlash
                  </Link>
                </div>
              </div>
            </div>

            {/* Hero image */}
            <div className="order-1 lg:order-2 relative flex items-end justify-center lg:justify-end">
              <div className="absolute top-12 right-4 rounded-2xl flex items-center justify-center shadow-lg z-10"
                style={{ background:"white", padding:"10px", animation:"float 6s ease-in-out infinite" }}>
                <GraduationCap size={24} style={{ color:"#a855f7" }} />
              </div>
              <div className="absolute bottom-1/4 right-2 rounded-2xl flex items-center justify-center shadow-lg z-10"
                style={{ background:"white", padding:"10px", animation:"float 6s ease-in-out infinite 2.4s" }}>
                <Star size={24} className="fill-yellow-400 text-yellow-400" />
              </div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full"
                style={{ background:"radial-gradient(circle,rgba(168,85,247,0.22) 0%,transparent 70%)" }} />
              <Image src="/hero-girl.png" alt="BilimMakon O'qituvchi"
                width={580} height={680} priority
                className="relative z-10 object-contain w-full max-w-[580px]"
                style={{ filter:"drop-shadow(0 24px 48px rgba(168,85,247,0.25))" }} />
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-24 px-4" style={{ background:"linear-gradient(180deg,#fff 0%,#fdf4ff 100%)" }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold mb-2" style={{ color:"#1a1a2e" }}>Platforma Imkoniyatlari</h2>
              <p style={{ color:"#6b6b8f" }}>O&apos;qituvchilarning kasbiy o&apos;sishi uchun barcha imkoniyatlar jamlangan</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon:BookOpen, title:"Video Darslar", desc:"Professional video darslar va materiallar bilan to'liq kurs.", bg:"rgba(168,85,247,0.1)", ic:"#a855f7" },
              { icon:ClipboardList, title:"Testlar", desc:"Modul imtihonlari va haqiqiy attestatsiya simulyatori.", bg:"rgba(59,130,246,0.1)", ic:"#3b82f6" },
              { icon:Brain, title:"AI Mentor", desc:"Informatika bo'yicha shaxsiy AI-o'qituvchi. 10 ta savol/kun.", bg:"rgba(236,72,153,0.1)", ic:"#ec4899" },
              { icon:Award, title:"Progress", desc:"O'rganish jarayoningizni kuzating va natijalaringizni ko'ring.", bg:"rgba(245,158,11,0.1)", ic:"#f59e0b" },
            ].map((f,i) => (
              <div key={i} className="rounded-2xl p-6 transition-all hover:scale-105"
                style={{ background:"white", border:"1px solid rgba(168,85,247,0.1)", boxShadow:"0 4px 20px rgba(168,85,247,0.06)" }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background:f.bg }}>
                  <f.icon size={22} style={{ color:f.ic }} />
                </div>
                <h3 className="font-bold text-base mb-2" style={{ color:"#1a1a2e" }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color:"#6b6b8f" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STEPS */}
      <section className="py-24 px-4" style={{ background:"#fff" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold" style={{ color:"#1a1a2e" }}>Qanday ishlaydi?</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { n:1, title:"Ro'yxatdan o'ting", desc:"Bepul hisob yarating" },
              { n:2, title:"Adminga murojaat", desc:"Telegram orqali kirish kaliti oling" },
              { n:3, title:"Darslarni o'tkazing", desc:"Video, quiz, AI Mentor bilan o'rganing" },
              { n:4, title:"Simulyatorda mashq", desc:"Attestatsiyaga tayyorlanib, ishonch bilan kiring" },
            ].map((s,i) => (
              <div key={i} className="text-center relative">
                {i < 3 && <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5" style={{ background:"linear-gradient(90deg,rgba(168,85,247,0.4),rgba(168,85,247,0.05))" }} />}
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 relative z-10"
                  style={{ background:"linear-gradient(135deg,#a855f7,#7c3aed)", boxShadow:"0 4px 20px rgba(168,85,247,0.3)" }}>
                  <span className="text-white font-bold text-xl">{s.n}</span>
                </div>
                <h3 className="font-bold text-sm mb-1" style={{ color:"#1a1a2e" }}>{s.title}</h3>
                <p className="text-xs" style={{ color:"#6b6b8f" }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 px-4" style={{ background:"linear-gradient(135deg,#fce7ff,#ede9fe)" }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12" style={{ color:"#1a1a2e" }}>O&apos;qituvchilar nima deydi?</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { name:"Nodira Hasanova", role:"Informatika o'qituvchisi, Toshkent", text:"BilimMakon orqali attestatsiyaga juda yaxshi tayyorlandim. AI Mentor menga zaif tomonlarimni ko'rsatdi." },
              { name:"Bobur Yusupov", role:"Informatika o'qituvchisi, Samarqand", text:"Simulyator juda real. Haqiqiy imtihon kabi his qiladi. Birinchi urinishdayoq o'tdim!" },
              { name:"Malika Rahimova", role:"Informatika o'qituvchisi, Namangan", text:"Har bir dars quizi mavzuni qanchalik bilishimni aniqlab berdi. Juda foydali platforma." },
            ].map((t,i) => (
              <div key={i} className="rounded-2xl p-6"
                style={{ background:"rgba(255,255,255,0.85)", backdropFilter:"blur(10px)", border:"1px solid rgba(168,85,247,0.1)" }}>
                <div className="flex gap-1 mb-3">
                  {[1,2,3,4,5].map(j=><Star key={j} size={14} className="fill-yellow-400 text-yellow-400"/>)}
                </div>
                <p className="text-sm leading-relaxed mb-4" style={{ color:"#4a4a6a" }}>&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm"
                    style={{ background:"linear-gradient(135deg,#a855f7,#ec4899)" }}>
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color:"#1a1a2e" }}>{t.name}</p>
                    <p className="text-xs" style={{ color:"#9898bb" }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4" style={{ background:"#fff" }}>
        <div className="max-w-2xl mx-auto text-center">
          <div className="rounded-3xl p-10 relative overflow-hidden"
            style={{ background:"linear-gradient(135deg,#a855f7,#7c3aed)", boxShadow:"0 20px 60px rgba(124,58,237,0.35)" }}>
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage:"radial-gradient(circle at 1px 1px,rgba(255,255,255,0.4) 1px,transparent 0)", backgroundSize:"28px 28px" }} />
            <h2 className="text-3xl font-extrabold text-white mb-3 relative">Bugun boshlang!</h2>
            <p className="text-purple-100 mb-7 relative">Minglab o&apos;qituvchilar allaqachon attestatsiyaga tayyorlanmoqda</p>
            <Link href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-purple-700 bg-white hover:bg-purple-50 transition-all hover:scale-105 relative"
              style={{ boxShadow:"0 4px 20px rgba(0,0,0,0.15)" }}>
              Bepul ro&apos;yxatdan o&apos;tish <ChevronRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 px-4" style={{ background:"#1a1a2e" }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background:"linear-gradient(135deg,#a855f7,#7c3aed)" }}>
              <BookOpen size={16} className="text-white" />
            </div>
            <span className="font-bold text-white">BilimMakon</span>
          </div>
          <p className="text-sm" style={{ color:"#6b6b8f" }}>© 2024 BilimMakon. Barcha huquqlar himoyalangan.</p>
          <div className="flex gap-5">
            {["Shartlar","Maxfiylik","Aloqa"].map(l=>(
              <a key={l} href="#" className="text-sm transition-colors hover:text-purple-400" style={{ color:"#6b6b8f" }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
