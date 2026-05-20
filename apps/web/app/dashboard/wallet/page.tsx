"use client";

import DashboardShell, { useDashboard, DashboardTopbar, PageTitle } from "@/components/DashboardShell";
import Link from "next/link";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "/mes",
    desc: "Para experimentación",
    features: ["100 req/día", "8 devices", "Métodos: rem_snn, rem", "Soporte comunidad"],
    cta: "Plan actual",
    current: true,
    color: "rgba(255,255,255,0.15)",
  },
  {
    name: "Pro",
    price: "$49",
    period: "/mes",
    desc: "Para producción",
    features: ["Requests ilimitados", "Todos los QPUs", "Prioridad de cola", "Soporte email 24h", "Historial de jobs"],
    cta: "Actualizar a Pro →",
    current: false,
    color: "#7c3aed",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "Para organizaciones",
    features: ["Todo lo de Pro", "SLA garantizado", "Deploy privado", "API keys múltiples", "Soporte dedicado"],
    cta: "Contactar →",
    current: false,
    color: "#06b6d4",
  },
];

function WalletContent() {
  const { me } = useDashboard();

  const used     = me?.requests_today ?? 0;
  const limit    = me?.daily_limit ?? 100;
  const pct      = me?.daily_limit ? Math.min(100, (used / limit) * 100) : 0;
  const remaining = me?.daily_limit !== null ? (limit - used) : null;

  return (
    <>
      <DashboardTopbar title="Wallet" crumb="Wallet" />
      <main className="flex-1 px-8 py-8">
        <PageTitle title="Wallet" sub="Gestiona tu plan y uso de requests cuánticos." />

        {/* Current balance card */}
        <div className="rounded-2xl p-7 mb-7 relative overflow-hidden"
          style={{ background:"rgba(124,58,237,0.06)", border:"1px solid rgba(124,58,237,0.2)" }}>
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-15"
            style={{ background:"radial-gradient(circle,#7c3aed,transparent)" }}/>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full opacity-10"
            style={{ background:"radial-gradient(circle,#06b6d4,transparent)" }}/>

          <div className="relative z-10 flex items-start justify-between gap-6 flex-wrap">
            <div>
              <p className="text-[11px] font-bold text-white/30 uppercase tracking-widest mb-2">Requests disponibles hoy</p>
              <p className="text-5xl font-extrabold text-white tracking-tight font-mono">
                {remaining !== null ? remaining : "∞"}
              </p>
              <p className="text-sm text-white/35 mt-1.5">
                {remaining !== null ? `de ${limit} diarios · Plan Free` : "Requests ilimitados · Plan Pro"}
              </p>
            </div>

            {me?.tier === "free" && (
              <Link href="/#pricing"
                className="shimmer-btn inline-flex items-center justify-center px-5 h-10 rounded-xl text-sm font-bold text-white whitespace-nowrap">
                Actualizar a Pro →
              </Link>
            )}
          </div>

          {me?.tier === "free" && me.daily_limit !== null && (
            <div className="relative z-10 mt-6">
              <div className="flex justify-between text-xs text-white/30 mb-2">
                <span>Uso diario</span>
                <span>{used} / {limit} requests</span>
              </div>
              <div className="h-2 rounded-full" style={{ background:"rgba(255,255,255,0.08)" }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{
                    width:`${pct}%`,
                    background: pct>85 ? "linear-gradient(90deg,#f87171,#ef4444)" : "linear-gradient(90deg,#7c3aed,#06b6d4)",
                  }}/>
              </div>
            </div>
          )}
        </div>

        {/* Stats mini grid */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { l:"Total histórico", v: me?.requests_total ?? 0, unit:"requests" },
            { l:"Tier actual",     v: (me?.tier??"free").charAt(0).toUpperCase()+(me?.tier??"free").slice(1), unit:"" },
            { l:"Límite diario",   v: me?.daily_limit ?? "∞", unit: me?.daily_limit ? "req/día" : "" },
          ].map(({ l, v, unit }) => (
            <div key={l} className="rounded-2xl p-5" style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-[11px] text-white/30 uppercase tracking-widest mb-2">{l}</p>
              <p className="text-2xl font-extrabold text-white font-mono">{v}</p>
              {unit && <p className="text-xs text-white/25 mt-0.5">{unit}</p>}
            </div>
          ))}
        </div>

        {/* Pricing */}
        <h2 className="text-base font-bold text-white mb-4">Planes disponibles</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {PLANS.map(plan => (
            <div key={plan.name}
              className="rounded-2xl p-6 flex flex-col relative overflow-hidden transition-all"
              style={{
                background: plan.highlight ? "rgba(124,58,237,0.08)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${plan.highlight ? "rgba(124,58,237,0.35)" : "rgba(255,255,255,0.07)"}`,
                boxShadow: plan.highlight ? "0 0 40px rgba(124,58,237,0.1)" : "none",
              }}>
              {plan.highlight && (
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                  style={{ background:"rgba(124,58,237,0.3)", color:"#a78bfa", border:"1px solid rgba(124,58,237,0.4)" }}>
                  Popular
                </div>
              )}
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">{plan.name}</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-3xl font-extrabold text-white">{plan.price}</span>
                <span className="text-sm text-white/30 mb-1">{plan.period}</span>
              </div>
              <p className="text-xs text-white/30 mb-5">{plan.desc}</p>
              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-white/55">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l2.5 2.5 5.5-5.5" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              {plan.current ? (
                <div className="h-9 rounded-xl flex items-center justify-center text-xs font-semibold text-white/30"
                  style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)" }}>
                  Plan actual
                </div>
              ) : (
                <Link href={plan.name === "Enterprise" ? "mailto:hello@fractkit.io" : "/#pricing"}
                  className="shimmer-btn h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white">
                  {plan.cta}
                </Link>
              )}
            </div>
          ))}
        </div>
      </main>
    </>
  );
}

export default function WalletPage() {
  return <DashboardShell><WalletContent /></DashboardShell>;
}
