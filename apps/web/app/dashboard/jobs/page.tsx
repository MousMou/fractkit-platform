"use client";

import { useState } from "react";
import DashboardShell, { useDashboard, DashboardTopbar, PageTitle, StatCard } from "@/components/DashboardShell";

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  completed: { bg: "rgba(34,197,94,0.1)", text: "#4ade80", dot: "#22c55e" },
  failed:    { bg: "rgba(239,68,68,0.1)",  text: "#f87171", dot: "#ef4444" },
  running:   { bg: "rgba(251,191,36,0.1)", text: "#fbbf24", dot: "#f59e0b" },
};

function JobsContent() {
  const { jobs } = useDashboard();
  const [tab, setTab] = useState<"overview"|"all">("overview");

  // Stats
  const total     = jobs.length;
  const avgLatency = total ? (jobs.reduce((s,j) => s + j.latency_ms, 0) / total) : 0;
  const deviceCounts = jobs.reduce<Record<string,number>>((acc,j) => { acc[j.device]=(acc[j.device]??0)+1; return acc; }, {});
  const topDevice = Object.entries(deviceCounts).sort(([,a],[,b])=>b-a)[0]?.[0] ?? "—";

  return (
    <>
      <DashboardTopbar title="Jobs" crumb="Quantum Jobs" />
      <main className="flex-1 px-8 py-8">
        <div className="flex items-start justify-between mb-7">
          <PageTitle title="Quantum Jobs" sub="Historial de correcciones ejecutadas en esta sesión." />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
          <StatCard label="Total Jobs" value={total}
            iconPath="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            iconColor="#7c3aed" iconBg="rgba(124,58,237,0.15)" />
          <StatCard label="Completados" value={total} sub="tasa 100%"
            iconPath="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2m-6 9l2 2 4-4"
            iconColor="#22c55e" iconBg="rgba(34,197,94,0.12)" />
          <StatCard label="Latencia media" value={total ? `${avgLatency.toFixed(1)} ms` : "—"}
            iconPath="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            iconColor="#06b6d4" iconBg="rgba(6,182,212,0.12)" />
          <StatCard label="Device top" value={topDevice.replace("_"," ")}
            iconPath="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"
            iconColor="#f59e0b" iconBg="rgba(245,158,11,0.12)" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl mb-5 w-fit"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
          {(["overview","all"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize"
              style={{
                background: tab===t ? "rgba(124,58,237,0.25)" : "transparent",
                color: tab===t ? "#a78bfa" : "rgba(255,255,255,0.4)",
                border: tab===t ? "1px solid rgba(124,58,237,0.4)" : "1px solid transparent",
              }}>
              {t === "overview" ? "Overview" : "All Jobs"}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="grid lg:grid-cols-2 gap-5">
            {/* Jobs by device */}
            <div className="rounded-2xl p-6" style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)" }}>
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background:"#7c3aed" }}/>
                Jobs por device
              </h3>
              {Object.keys(deviceCounts).length === 0 ? (
                <p className="text-white/25 text-sm">Sin jobs todavía. Ejecuta una corrección.</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(deviceCounts).sort(([,a],[,b])=>b-a).map(([dev,count])=>{
                    const pct = (count/total)*100;
                    return (
                      <div key={dev}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-white/55 font-mono">{dev}</span>
                          <span className="text-white/35">{count} jobs · {pct.toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 rounded-full" style={{ background:"rgba(255,255,255,0.06)" }}>
                          <div className="h-full rounded-full" style={{ width:`${pct}%`, background:"linear-gradient(90deg,#7c3aed,#06b6d4)" }}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Method distribution */}
            <div className="rounded-2xl p-6" style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)" }}>
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background:"#06b6d4" }}/>
                Distribución de métodos
              </h3>
              {jobs.length === 0 ? (
                <p className="text-white/25 text-sm">Sin jobs todavía.</p>
              ) : (
                <div className="space-y-3">
                  {(["rem_snn","rem"] as const).map(m => {
                    const count = jobs.filter(j=>j.method===m).length;
                    const pct = total ? (count/total)*100 : 0;
                    if (!count) return null;
                    return (
                      <div key={m}>
                        <div className="flex justify-between text-xs mb-1">
                          <code className="text-white/55">{m}</code>
                          <span className="text-white/35">{count} · {pct.toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 rounded-full" style={{ background:"rgba(255,255,255,0.06)" }}>
                          <div className="h-full rounded-full" style={{ width:`${pct}%`, background:m==="rem_snn"?"#7c3aed":m==="rem"?"#06b6d4":"#a78bfa" }}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "all" && (
          <div className="rounded-2xl overflow-hidden" style={{ border:"1px solid rgba(255,255,255,0.07)" }}>
            {/* Table header */}
            <div className="grid grid-cols-6 gap-4 px-5 py-3 text-[10px] font-bold text-white/25 uppercase tracking-widest"
              style={{ background:"rgba(255,255,255,0.02)", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
              <span>Estado</span>
              <span className="col-span-2">Device · Método</span>
              <span className="text-center">Qubits</span>
              <span className="text-right">Latencia</span>
              <span className="text-right">Timestamp</span>
            </div>

            {jobs.length === 0 ? (
              <div className="px-5 py-16 text-center">
                <p className="text-white/25 text-sm">No hay jobs todavía.</p>
                <p className="text-white/15 text-xs mt-1">Ejecuta una corrección desde Overview.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.05]">
                {jobs.map(j => {
                  const s = STATUS_COLORS.completed;
                  return (
                    <div key={j.id} className="grid grid-cols-6 gap-4 px-5 py-3.5 items-center hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background:s.dot }}/>
                        <span className="text-xs" style={{ color:s.text }}>OK</span>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-white/70 font-mono">{j.device}</p>
                        <p className="text-[10px] text-white/30">{j.method}</p>
                      </div>
                      <p className="text-xs text-white/50 text-center">{j.n}</p>
                      <p className="text-xs text-white/50 text-right font-mono">{j.latency_ms.toFixed(1)} ms</p>
                      <p className="text-[10px] text-white/30 text-right font-mono">
                        {new Date(j.timestamp).toLocaleTimeString("es",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}

export default function JobsPage() {
  return <DashboardShell><JobsContent /></DashboardShell>;
}
