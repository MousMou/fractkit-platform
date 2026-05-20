"use client";

import { useState, useEffect } from "react";
import DashboardShell, { useDashboard, DashboardTopbar, PageTitle, StatCard } from "@/components/DashboardShell";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface DeviceInfo { id: string; name: string; family: string; qubits: number; recommended: boolean; }

// Local metadata to enrich the API response
const META: Record<string, { provider: string; topology?: string; status: "online"|"maintenance"|"offline"; t1?: string; gate2?: string; color: string }> = {
  ibm_marrakesh:   { provider:"IBM",     topology:"Heavy-Hex",   status:"online",       t1:"~300 μs", gate2:"0.7%",  color:"#7c3aed" },
  ibm_torino:      { provider:"IBM",     topology:"Heavy-Hex",   status:"online",       t1:"~250 μs", gate2:"0.8%",  color:"#7c3aed" },
  ibm_kingston:    { provider:"IBM",     topology:"Heavy-Hex",   status:"online",       t1:"~280 μs", gate2:"0.7%",  color:"#7c3aed" },
  iqm_garnet:      { provider:"IQM",     topology:"Star/Planar", status:"online",       t1:"~35 μs",  gate2:"0.7%",  color:"#06b6d4" },
  iqm_emerald:     { provider:"IQM",     topology:"Star",        status:"online",       t1:"~30 μs",  gate2:"0.9%",  color:"#06b6d4" },
  iqm_spark:       { provider:"IQM",     topology:"Star",        status:"online",       t1:"~25 μs",                 color:"#06b6d4" },
  rigetti_cepheus: { provider:"Rigetti", topology:"Octagonal",   status:"online",       t1:"~22 μs",  gate2:"1.1%",  color:"#f59e0b" },
  rigetti_aspen_m3:{ provider:"Rigetti", topology:"Octagonal",   status:"maintenance",  t1:"~18 μs",  gate2:"1.3%",  color:"#f59e0b" },
};

const STATUS_LABEL: Record<string,{ label:string; dot:string; text:string }> = {
  online:      { label:"Online",       dot:"#22c55e", text:"#4ade80" },
  maintenance: { label:"Maintenance",  dot:"#f59e0b", text:"#fbbf24" },
  offline:     { label:"Offline",      dot:"#ef4444", text:"#f87171" },
};

function DevicesContent() {
  const { apiKey } = useDashboard();
  const [devices, setDevices]   = useState<DeviceInfo[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [provider, setProvider] = useState<string>("All");

  useEffect(() => {
    if (!apiKey) return;
    fetch(`${API_URL}/v1/devices`, { headers:{ "X-API-Key": apiKey } })
      .then(r => r.json())
      .then(d => setDevices(d.devices ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [apiKey]);

  const providers = ["All", ...new Set(devices.map(d => META[d.id]?.provider ?? "Other"))];
  const filtered  = devices.filter(d => {
    const q   = search.toLowerCase();
    const meta = META[d.id] ?? {};
    const matchQ = !q || d.id.includes(q) || d.name.toLowerCase().includes(q) || (meta.provider??"").toLowerCase().includes(q);
    const matchP = provider === "All" || meta.provider === provider;
    return matchQ && matchP;
  });

  const online = devices.filter(d => META[d.id]?.status === "online").length;

  return (
    <>
      <DashboardTopbar title="Devices" crumb="Quantum Devices" />
      <main className="flex-1 px-8 py-8">
        <PageTitle title="Quantum Devices" sub="QPUs disponibles en el ecosistema noisebridge. Selecciona un device para la corrección." />

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
          <StatCard label="Total Devices" value={devices.length}
            iconPath="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"
            iconColor="#7c3aed" iconBg="rgba(124,58,237,0.15)" />
          <StatCard label="Online Now" value={online}
            iconPath="M5 13l4 4L19 7"
            iconColor="#22c55e" iconBg="rgba(34,197,94,0.12)" />
          <StatCard label="Providers" value={providers.length - 1}
            iconPath="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            iconColor="#06b6d4" iconBg="rgba(6,182,212,0.12)" />
          <StatCard label="Recomendados" value={devices.filter(d=>d.recommended).length}
            iconPath="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            iconColor="#f59e0b" iconBg="rgba(245,158,11,0.12)" />
        </div>

        {/* Search + filter */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Busca device, provider…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-white/20 outline-none"
              style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)" }}/>
          </div>
          <div className="flex gap-1.5">
            {providers.map(p => (
              <button key={p} onClick={()=>setProvider(p)}
                className="px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: provider===p ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.03)",
                  border:`1px solid ${provider===p ? "rgba(124,58,237,0.4)" : "rgba(255,255,255,0.07)"}`,
                  color: provider===p ? "#a78bfa" : "rgba(255,255,255,0.45)",
                }}>{p}</button>
            ))}
          </div>
        </div>

        {/* Device grid */}
        {loading ? (
          <div className="flex items-center gap-3 text-white/25 text-sm py-16 justify-center">
            <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-violet-500 animate-spin"/>
            Cargando devices…
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-white/25 text-sm py-16 text-center">Sin resultados para &quot;{search}&quot;.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(dev => {
              const meta   = META[dev.id] ?? { provider:"Unknown", status:"online", color:"#7c3aed" };
              const st     = STATUS_LABEL[meta.status] ?? STATUS_LABEL.online;
              return (
                <div key={dev.id} className="rounded-2xl p-5 flex flex-col gap-3 group hover:border-violet-500/30 transition-all"
                  style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)" }}>
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold"
                      style={{ background:`${meta.color}20`, color:meta.color }}>
                      {meta.provider.slice(0,3)}
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold"
                      style={{ background:`${st.dot}15`, color:st.text }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background:st.dot }}/>
                      {st.label}
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <p className="text-sm font-bold text-white">{dev.name}</p>
                    <p className="text-[10px] text-white/30 font-mono mt-0.5">{dev.id}</p>
                  </div>

                  {/* Specs */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { l:"Qubits",    v: dev.qubits },
                      { l:"Topology",  v: meta.topology ?? "—" },
                      { l:"T1",        v: meta.t1 ?? "—" },
                      { l:"2Q error",  v: meta.gate2 ?? "—" },
                    ].map(({l,v})=>(
                      <div key={l} className="rounded-lg p-2" style={{ background:"rgba(255,255,255,0.03)" }}>
                        <p className="text-[9px] text-white/25 uppercase tracking-wider">{l}</p>
                        <p className="text-xs font-semibold text-white/70 mt-0.5">{v}</p>
                      </div>
                    ))}
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mt-auto">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                      style={{ background:`${meta.color}15`, color:meta.color }}>
                      {meta.provider}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                      style={{ background:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.4)" }}>
                      {dev.family}
                    </span>
                    {dev.recommended && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                        style={{ background:"rgba(245,158,11,0.12)", color:"#fbbf24" }}>
                        ★ Rec.
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}

export default function DevicesPage() {
  return <DashboardShell><DevicesContent /></DashboardShell>;
}
