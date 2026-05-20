"use client";

import { useState } from "react";
import DashboardShell, { useDashboard, DashboardTopbar, PageTitle } from "@/components/DashboardShell";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function KeysContent() {
  const { me, apiKey } = useDashboard();
  const [revealed,  setRevealed]  = useState(false);
  const [copied,    setCopied]    = useState(false);
  const [email,     setEmail]     = useState("");
  const [sending,   setSending]   = useState(false);
  const [sent,      setSent]      = useState(false);
  const [sendErr,   setSendErr]   = useState<string|null>(null);

  function handleCopy() {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    setSendErr(null);
    setSending(true);
    try {
      await fetch(`${API_URL}/v1/resend-key`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      setSent(true);
    } catch { setSendErr("No se pudo enviar. Intenta de nuevo."); }
    finally { setSending(false); }
  }

  const maskedKey = apiKey
    ? apiKey.slice(0, 12) + "●".repeat(Math.max(0, apiKey.length - 16)) + apiKey.slice(-4)
    : "—";

  return (
    <>
      <DashboardTopbar title="API Keys" crumb="API Keys" />
      <main className="flex-1 px-8 py-8">
        <PageTitle title="API Keys" sub="Gestiona tu clave de acceso a la API de noisebridge." />

        <div className="max-w-2xl space-y-5">
          {/* Key card */}
          <div className="rounded-2xl p-6" style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold text-white">Tu API Key activa</h2>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                style={{ background:"rgba(34,197,94,0.1)", color:"#4ade80", border:"1px solid rgba(34,197,94,0.2)" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-green-400"/>
                Activa
              </div>
            </div>

            {/* Key display */}
            <div className="rounded-xl p-4 mb-4 flex items-center gap-3"
              style={{ background:"rgba(124,58,237,0.06)", border:"1px solid rgba(124,58,237,0.18)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.8" strokeLinecap="round" className="flex-shrink-0">
                <path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
              </svg>
              <code className="flex-1 text-[13px] font-mono text-violet-300 break-all">
                {revealed ? apiKey : maskedKey}
              </code>
            </div>

            <div className="flex gap-2.5">
              <button onClick={() => setRevealed(r=>!r)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
                style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.09)", color:"rgba(255,255,255,0.6)" }}>
                {revealed ? (
                  <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/></svg>Ocultar</>
                ) : (
                  <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>Revelar</>
                )}
              </button>
              <button onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: copied ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${copied ? "rgba(124,58,237,0.4)" : "rgba(255,255,255,0.09)"}`,
                  color: copied ? "#a78bfa" : "rgba(255,255,255,0.6)",
                }}>
                {copied ? (
                  <><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 6.5l2.5 2.5 6.5-6.5" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>Copiado</>
                ) : (
                  <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>Copiar</>
                )}
              </button>
            </div>
          </div>

          {/* Key metadata */}
          <div className="rounded-2xl p-6" style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)" }}>
            <h2 className="text-sm font-bold text-white mb-4">Detalles</h2>
            <dl className="space-y-4">
              {[
                { l:"Prefijo",         v: me?.key_prefix ?? "—",                    mono:true },
                { l:"Email",           v: me?.email ?? "—",                          mono:false },
                { l:"Tier",            v: (me?.tier??"free").charAt(0).toUpperCase()+(me?.tier??"free").slice(1), mono:false },
                { l:"Requests hoy",    v: `${me?.requests_today ?? 0} / ${me?.daily_limit ?? "∞"}`, mono:true },
                { l:"Requests total",  v: (me?.requests_total ?? 0).toLocaleString(), mono:true },
                { l:"Creada",          v: me?.created_at ? new Date(me.created_at).toLocaleDateString("es") : "—", mono:false },
              ].map(({l,v,mono})=>(
                <div key={l} className="flex items-start justify-between gap-4 pb-4"
                  style={{ borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                  <dt className="text-xs text-white/30 flex-shrink-0">{l}</dt>
                  <dd className={`text-xs text-right break-all ${mono ? "font-mono text-white/60" : "text-white/60"}`}>{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Resend key via email */}
          <div className="rounded-2xl p-6" style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)" }}>
            <h2 className="text-sm font-bold text-white mb-1">Recuperar key por email</h2>
            <p className="text-xs text-white/30 mb-5">
              Si perdiste tu API key, ingresa tu email registrado y te la enviaremos.
            </p>

            {sent ? (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background:"rgba(34,197,94,0.07)", border:"1px solid rgba(34,197,94,0.18)" }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="#4ade80" strokeWidth="1.4"/>
                  <path d="M5 8l2 2 4-4" stroke="#4ade80" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p className="text-green-400 text-xs">Email enviado. Revisa tu bandeja de entrada.</p>
              </div>
            ) : (
              <form onSubmit={handleResend} className="flex gap-2.5">
                <input type="email" required value={email} onChange={e=>setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="flex-1 px-3 py-2.5 rounded-xl text-sm text-white placeholder-white/20 outline-none"
                  style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)" }}/>
                <button type="submit" disabled={sending}
                  className="shimmer-btn px-4 py-2.5 rounded-xl text-xs font-bold text-white disabled:opacity-50 whitespace-nowrap">
                  {sending ? "Enviando…" : "Enviar key →"}
                </button>
              </form>
            )}
            {sendErr && <p className="text-red-400 text-xs mt-2">{sendErr}</p>}
          </div>

          {/* Usage in code */}
          <div className="rounded-2xl overflow-hidden" style={{ border:"1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-2 px-4 py-2.5"
              style={{ background:"rgba(255,255,255,0.02)", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
              <span className="text-[10px] text-white/25 font-mono uppercase tracking-widest">Uso de la API key</span>
            </div>
            <pre className="px-4 py-4 text-[11px] font-mono text-white/50 leading-relaxed overflow-x-auto"
              style={{ background:"rgba(255,255,255,0.015)" }}>
{`# HTTP Header
curl -H "X-API-Key: ${me?.key_prefix ?? "nb-..."}****" \\
  https://api.fractkit.io/v1/correct

# Python SDK
from noisebridge import rem_snn_correct
# Configura tu key:
import os; os.environ["NOISEBRIDGE_API_KEY"] = "tu-api-key"
`}
            </pre>
          </div>
        </div>
      </main>
    </>
  );
}

export default function KeysPage() {
  return <DashboardShell><KeysContent /></DashboardShell>;
}
