"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type Step = "form" | "success";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/v1/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail ?? "Registro fallido. Intenta de nuevo.");
        return;
      }
      setApiKey(data.api_key);
      setStep("success");
    } catch {
      setError("No se pudo contactar el servidor. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleGoDashboard() {
    if (!apiKey) return;
    localStorage.setItem("fk_api_key", apiKey);
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: "#050510" }}>
      {/* Glow */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(124,58,237,0.16) 0%, transparent 70%)",
      }} />

      {/* Logo */}
      <Link href="/"
        className="relative z-10 font-mono text-xl font-bold tracking-tight mb-10 hover:opacity-75 transition-opacity">
        fract<span className="text-violet-400">kit</span>
      </Link>

      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-2xl p-8" style={{
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }}>

          {/* ── Step 1: Form ── */}
          {step === "form" && (
            <>
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
                  style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)" }}>
                  <span className="live-dot" style={{ width: 6, height: 6 }} />
                  <span className="text-xs font-semibold text-violet-400">Gratis · 100 req/día</span>
                </div>
                <h1 className="text-2xl font-extrabold text-white tracking-tight mb-1">
                  Crea tu API key
                </h1>
                <p className="text-white/35 text-sm">
                  Sin tarjeta de crédito. Acceso inmediato.
                </p>
              </div>

              {/* Benefits */}
              <div className="grid grid-cols-3 gap-2 mb-6">
                {[
                  { icon: "⚡", label: "Instant" },
                  { icon: "🔒", label: "Seguro" },
                  { icon: "🆓", label: "Gratis" },
                ].map(({ icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-1 py-3 rounded-xl text-center"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <span className="text-lg">{icon}</span>
                    <span className="text-xs text-white/35 font-medium">{label}</span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label htmlFor="email"
                    className="block text-xs font-semibold text-white/40 mb-2 uppercase tracking-widest">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    autoComplete="email"
                    className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none transition-all duration-200 focus:ring-2 focus:ring-violet-500/50"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
                  />
                  <p className="text-white/20 text-xs mt-2">
                    Lo usarás para recuperar tu key si la pierdes.
                  </p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                    style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)" }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
                      <circle cx="7" cy="7" r="6" stroke="#f87171" strokeWidth="1.4"/>
                      <path d="M7 4.5v3M7 9.5h.01" stroke="#f87171" strokeWidth="1.4" strokeLinecap="round"/>
                    </svg>
                    <p className="text-red-400 text-xs">{error}</p>
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="shimmer-btn w-full inline-flex items-center justify-center h-11 rounded-xl text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                      Creando key…
                    </span>
                  ) : "Crear API key gratis →"}
                </button>
              </form>

              <p className="text-xs text-white/20 mt-5 text-center leading-relaxed">
                Al registrarte aceptas nuestros{" "}
                <Link href="/terms" className="text-white/35 hover:text-white/60 transition-colors underline">Términos</Link>
                {" "}y{" "}
                <Link href="/privacy" className="text-white/35 hover:text-white/60 transition-colors underline">Privacidad</Link>.
              </p>
            </>
          )}

          {/* ── Step 2: Success ── */}
          {step === "success" && apiKey && (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(124,58,237,0.18)", border: "1px solid rgba(124,58,237,0.4)" }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M4 10.5L8 14.5L16 6.5" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-white">¡Key creada!</h2>
                  <p className="text-white/35 text-xs