"use client";
import { useState, useEffect, useCallback } from "react";
import { Users, Search, Ban, CheckCircle, Key, Loader2, X, Smartphone, Copy, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

function genKey() {
  const c="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const s=()=>Array(4).fill(0).map(()=>c[Math.floor(Math.random()*c.length)]).join("");
  return `${s()}-${s()}-${s()}`;
}

export default function AdminUsersPage() {
  const [users,setUsers]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState("");
  const [filter,setFilter]=useState<"all"|"blocked"|"no_key">("all");
  const [keyModal,setKeyModal]=useState<any>(null);
  const [sessionModal,setSessionModal]=useState<any>(null);
  const [sessions,setSessions]=useState<any[]>([]);
  const [gKey,setGKey]=useState(genKey());
  const [kNote,setKNote]=useState("");
  const [kMax,setKMax]=useState(1);
  const [kExpiry,setKExpiry]=useState("");
  const [savingKey,setSavingKey]=useState(false);
  const supabase=createClient();

  const fetch=useCallback(async()=>{
    setLoading(true);
    const {data}=await supabase.from("profiles").select("*").order("created_at",{ascending:false});
    setUsers(data??[]);
    setLoading(false);
  },[supabase]);

  useEffect(()=>{fetch();},[fetch]);

  const filtered=users.filter(u=>{
    const q=search.toLowerCase();
    const ms=!q||u.full_name?.toLowerCase().includes(q)||u.email?.toLowerCase().includes(q);
    const mf=filter==="all"?true:filter==="blocked"?u.is_blocked:!u.access_key_id;
    return ms&&mf;
  });

async function toggleBlock(u:any){
    await supabase.from("profiles").update({is_blocked:!u.is_blocked}).eq("id",u.id);
    if(!u.is_blocked){
      await supabase.from("user_blocks").upsert({user_id:u.id,reason:"Admin tomonidan bloklandi",auto_blocked:false},{onConflict:"user_id"});
    } else {
      await supabase.from("user_blocks").update({unblocked_at:new Date().toISOString()}).eq("user_id",u.id);
      await supabase.from("user_sessions").update({is_active:false}).eq("user_id",u.id);
      await supabase.from("profiles").update({device_count:0}).eq("id",u.id);
    }
    toast.success(u.is_blocked?"Blok ochildi":"Bloklandi");
    fetch();
  }

  async function saveKey(){
    if(!keyModal) return;
    setSavingKey(true);
    try{
      const {data:{user}}=await supabase.auth.getUser();
      const {error}=await supabase.from("access_keys").insert({
        key:gKey,note:kNote||`${keyModal.full_name} uchun`,
        max_devices:kMax,expires_at:kExpiry?new Date(kExpiry).toISOString():null,
        created_by:user?.id,is_active:true,
      });
      if(error) throw error;
      toast.success("Kalit yaratildi! Nusxalab yuboring.");
      navigator.clipboard.writeText(gKey).catch(()=>{});
    } catch(e:any){toast.error(e.message??"Xatolik");}
    finally{setSavingKey(false);}
  }

  async function viewSessions(u:any){
    setSessionModal(u);
    const {data}=await supabase.from("user_sessions").select("*").eq("user_id",u.id).order("created_at",{ascending:false});
    setSessions(data??[]);
  }

  async function revokeSession(id:string){
    await supabase.from("user_sessions").update({is_active:false}).eq("id",id);
    if(sessionModal) viewSessions(sessionModal);
    toast.success("Sessiya bekor qilindi");
  }

  return(
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1" style={{color:"var(--text-primary)"}}>Foydalanuvchilar</h1>
        <p style={{color:"var(--text-secondary)"}}>Boshqarish, bloklash, kalit berish</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-5">
        {[
          {label:"Jami",value:users.length,color:"rgba(168,85,247,0.1)",ic:"#a855f7"},
          {label:"Faol",value:users.filter(u=>!u.is_blocked&&u.access_key_id).length,color:"rgba(16,185,129,0.1)",ic:"#10b981"},
          {label:"Bloklangan",value:users.filter(u=>u.is_blocked).length,color:"rgba(239,68,68,0.1)",ic:"#ef4444"},
          {label:"Kalitsiz",value:users.filter(u=>!u.access_key_id&&!u.is_blocked&&u.role!=="admin").length,color:"rgba(245,158,11,0.1)",ic:"#f59e0b"},
        ].map(s=>(
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:s.color}}>
              <Users size={17} style={{color:s.ic}}/>
            </div>
            <div>
              <div className="text-2xl font-bold" style={{color:"var(--text-primary)"}}>{s.value}</div>
              <div className="text-xs" style={{color:"var(--text-secondary)"}}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{color:"var(--text-tertiary)"}}/>
          <input className="input pl-9 w-full text-sm" placeholder="Ism yoki email..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        {(["all","blocked","no_key"] as const).map(f=>(
          <button key={f} onClick={()=>setFilter(f)}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{background:filter===f?"linear-gradient(135deg,#a855f7,#7c3aed)":"var(--bg-secondary)",color:filter===f?"white":"var(--text-secondary)"}}>
            {f==="all"?"Barchasi":f==="blocked"?"Bloklangan":"Kalitsiz"}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b" style={{borderColor:"var(--border)"}}>
          <span className="font-bold text-sm" style={{color:"var(--text-primary)"}}>{filtered.length} foydalanuvchi</span>
        </div>
        {loading?(
          <div className="p-8 flex justify-center"><Loader2 size={28} className="animate-spin" style={{color:"var(--text-tertiary)"}}/></div>
        ):(
          <div className="divide-y" style={{borderColor:"var(--border)"}}>
            {filtered.map((u:any)=>(
              <div key={u.id} className="flex items-center gap-3 p-4 hover:bg-[var(--bg-secondary)] transition-colors">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white flex-shrink-0 ${u.is_blocked?"opacity-40":""}`}
                  style={{background:"linear-gradient(135deg,#a855f7,#ec4899)"}}>
                  {u.full_name?.[0]??"?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate" style={{color:"var(--text-primary)"}}>{u.full_name}</div>
                  <div className="text-xs truncate" style={{color:"var(--text-tertiary)"}}>{u.email}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  {u.is_blocked && <span className="badge badge-red">Blok</span>}
                  {!u.access_key_id && !u.is_blocked && u.role!=="admin" && <span className="badge badge-yellow">Kalitsiz</span>}
                  {u.access_key_id && !u.is_blocked && <span className="badge badge-green">Faol</span>}
                  {u.role==="admin" && <span className="badge badge-purple">Admin</span>}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={()=>{setKeyModal(u);setGKey(genKey());setKNote(`${u.full_name} uchun`);setKMax(1);setKExpiry("");}}
                    title="Kalit yaratish" className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-tertiary)] transition-colors" style={{color:"#a855f7"}}>
                    <Key size={15}/>
                  </button>
                  <button onClick={()=>viewSessions(u)} title="Qurilmalar"
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-tertiary)] transition-colors" style={{color:"var(--text-secondary)"}}>
                    <Smartphone size={15}/>
                  </button>
                  {u.role!=="admin" && (
                    <button onClick={()=>toggleBlock(u)} title={u.is_blocked?"Blokni ochish":"Bloklash"}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${u.is_blocked?"hover:bg-green-50 text-green-600":"hover:bg-red-50 text-red-500"}`}>
                      {u.is_blocked?<CheckCircle size={15}/>:<Ban size={15}/>}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {filtered.length===0&&(
              <div className="py-12 text-center">
                <Users size={28} className="mx-auto mb-2" style={{color:"var(--text-tertiary)"}}/>
                <p style={{color:"var(--text-secondary)"}}>Topilmadi</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* KEY MODAL */}
      {keyModal&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:"rgba(0,0,0,0.6)"}}>
          <div className="w-full max-w-md rounded-2xl p-6 shadow-xl" style={{background:"var(--surface)"}}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold" style={{color:"var(--text-primary)"}}>Kalit yaratish — {keyModal.full_name}</h2>
              <button onClick={()=>setKeyModal(null)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-secondary)]" style={{color:"var(--text-secondary)"}}><X size={17}/></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{color:"var(--text-primary)"}}>Kalit</label>
                <div className="flex gap-2">
                  <div className="input flex-1 font-mono text-center font-bold tracking-widest text-base" style={{color:"#a855f7"}}>{gKey}</div>
                  <button onClick={()=>{navigator.clipboard.writeText(gKey);toast.success("Nusxalandi!");}} className="w-10 rounded-xl border flex items-center justify-center hover:bg-[var(--bg-secondary)]" style={{borderColor:"var(--border)",color:"var(--text-secondary)"}}><Copy size={15}/></button>
                  <button onClick={()=>setGKey(genKey())} className="w-10 rounded-xl border flex items-center justify-center hover:bg-[var(--bg-secondary)]" style={{borderColor:"var(--border)",color:"var(--text-secondary)"}}><RefreshCw size={15}/></button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{color:"var(--text-primary)"}}>Max qurilma</label>
                  <select className="input" value={kMax} onChange={e=>setKMax(Number(e.target.value))}>
                    <option value={1}>1 qurilma</option><option value={2}>2 qurilma</option><option value={3}>3 qurilma</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{color:"var(--text-primary)"}}>Muddati</label>
                  <input type="date" className="input" value={kExpiry} onChange={e=>setKExpiry(e.target.value)} min={new Date().toISOString().split("T")[0]}/>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{color:"var(--text-primary)"}}>Izoh</label>
                <input className="input" value={kNote} onChange={e=>setKNote(e.target.value)}/>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={saveKey} disabled={savingKey} className="btn-primary flex-1">
                {savingKey&&<Loader2 size={15} className="animate-spin"/>} Saqlash + Nusxalash
              </button>
              <button onClick={()=>setKeyModal(null)} className="btn-secondary flex-1">Yopish</button>
            </div>
          </div>
        </div>
      )}

      {/* SESSIONS MODAL */}
      {sessionModal&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:"rgba(0,0,0,0.6)"}}>
          <div className="w-full max-w-lg rounded-2xl p-6 shadow-xl" style={{background:"var(--surface)"}}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold" style={{color:"var(--text-primary)"}}>{sessionModal.full_name} — Qurilmalar</h2>
              <button onClick={()=>setSessionModal(null)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-secondary)]" style={{color:"var(--text-secondary)"}}><X size={17}/></button>
            </div>
            {sessions.length===0?(
              <p className="text-center py-8" style={{color:"var(--text-secondary)"}}>Hali qurilma yo'q</p>
            ):(
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {sessions.map((s:any)=>(
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-xl gap-3" style={{background:"var(--bg-secondary)"}}>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono truncate" style={{color:"var(--text-secondary)"}}>{s.device_info?.substring(0,55)}...</p>
                      <p className="text-xs mt-0.5" style={{color:"var(--text-tertiary)"}}>{new Date(s.created_at).toLocaleString("uz-UZ")}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`badge ${s.is_active?"badge-green":"badge-yellow"}`}>{s.is_active?"Faol":"Nofaol"}</span>
                      {s.is_active&&<button onClick={()=>revokeSession(s.id)} className="text-xs px-2 py-1 rounded-lg text-red-500 hover:bg-red-50 transition-colors">Bekor</button>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
