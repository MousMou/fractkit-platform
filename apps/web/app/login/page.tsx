"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type Tab = "key" | "email";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("key");

  // API Key tab
  const [apiKey, setApiKey] = useState("");
  const [loadingKey, setLoadingKey] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);

  // Email tab
  const [email, setEmail] = useState("");
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  async function handleKeySubmit(e: React.FormEvent) {
    e.preventDefault();
    setKeyError(null);
    const key = apiKey.trim();
    if (!key) return;

    setLoadingKey(true);
    try {
      const res = await fetch(`${API_URL}/v1/me`, {
        headers: { "X-API-Key": key },
      });
      if (res.status === 401) {
        setKeyError("API key inválida. Revísala e intenta de nuevo.");
        return;
      }
      if (!res.ok) {
        setKeyError("Algo salió mal. Intenta de nuevo.");
        return;
      }
      localStorage.setItem("fk_api_key", key);
      router.push("/dashboard");
    } catch {
      setKeyError("No se pudo contactar el servidor. Intenta en un momento.");
    } finally {
      setLoadingKey(false);
    }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEmailError(null);
    setLoadingEmail(true);
    try {
      await fetch(`${API_URL}/v1/resend-key`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      // Always show success (anti-enumeration)
      setEmailSent(true);
    } catch {
      setEmailError("No se pudo contactar el servidor. Intenta de nuevo.");
    } finally {
      setLoadingEmail(false);
    }
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
        {/* Card */}
        <div className="rounded-2xl p-8" style={{
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }}>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mb-1">Acceder</h1>
          <p className="text-white/35 text-sm mb-6">
            Ingresa al dashboard de tu cuenta noisebridge.
          </p>

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl mb-6"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
            {([
              { id: "key" as Tab, label: "API Key" },
              { id: "email" as Tab, label: "Recuperar por email" },
            ]).map(({ id, label }) => (
              <button key={id} type="button"
                onClick={() => { setTab(id); setKeyError(null); setEmailError(null); setEmailSent(false); }}
                className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: tab === id ? "rgba(124,58,237,0.3)" : "transparent",
                  color: tab === id ? "#a78bfa" : "rgba(255,255,255,0.35)",
                  border: tab === id ? "1px solid rgba(124,58,237,0.4)" : "1px solid transparent",
                }}>
                {label}
              </button>
            ))}
          </div>

          {/* ── API Key Tab ── */}
          {tab === "key" && (
            <form onSubmit={handleKeySubmit} className="flex flex-col gap-4">
              <div>
                <label htmlFor="apikey"
                  className="block text-xs font-semibold text-white/40 mb-2 uppercase tracking-widest">
                  Tu API Key
                </label>
                <input
                  id="apikey"
                  type="password"
                  required
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="nb-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  autoComplete="current-password"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none transition-all duration-200 focus:ring-2 focus:ring-violet-500/50 font-mono"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
                />
              </div>

              {keyError && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                  style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)" }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
                    <circle cx="7" cy="7" r="6" stroke="#f87171" strokeWidth="1.4"/>
                    <path d="M7 4.5v3M7 9.5h.01" stroke="#f87171" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                  <p className="text-red-400 text-xs">{keyError}</p>
                </div>
              )}

              <button type="submit" disabled={loadingKey}
                className="shimmer-btn w-full inline-flex items-center justify-center h-11 rounded-xl text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed">
                {loadingKey ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                    Verificando…
                  </span>
                ) : "Abrir dashboard →"}
              </button>
            </form>
          )}

          {/* ── Email Tab ── */}
          {tab === "email" && !emailSent && (
            <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
              <div>
                <label htmlFor="email"
                  className="block text-xs font-semibold text-white/40 mb-2 uppercase tracking-widest">
                  Email registrado
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
                <p className="text-white/25 text-xs mt-2">
                  Te enviaremos tu API key al email con el que te registraste.
                </p>
              </div>

              {emailError && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                  style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)" }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
                    <circle cx="7" cy="7" r="6" stroke="#f87171" strokeWidth="1.4"/>
                    <path d="M7 4.5v3M7 9.5h.01" stroke="#f87171" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                  <p className="text-red-400 text-xs">{emailError}</p>
                </div>
              )}

              <button type="submit" disabled={loadingEmail}
                className="shimmer-btn w-full inline-flex items-center justify-center h-11 rounded-xl text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed">
                {loadingEmail ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                    Enviando…
                  </span>
                ) : "Enviar mi API key →"}
              </button>
            </form>
          )}

          {/* Email sent confirmation */}
          {tab === "email" && emailSent && (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.35)" }}>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <path d="M2 6l9 6 9-6" stroke="#a78bfa" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  <rect x="2" y="4" width="18" height="14" rx="2" stroke="#a78bfa" strokeWidth="1.6"/>
                </svg>
              </div>
              <h3 className="text-white font-bold mb-1">¡Revisa tu email!</h3>
              <p className="text-white/35 text-sm mb-5">
                Si <span className="text-white/60 font-mono">{email}</span> está registrado,<br />
                recibirás tu API key en segundos.
              </p>
              <button onClick={() => { setEmailSent(false); setTab("key"); }}
                className="text-xs text-violet-400 hover:text-violet-300 transition-colors font-semibold">
                Tengo mi key, acceder →
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-white/20 text-xs mt-5">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="text-violet-400 hover:text-violet-300 transition-colors font-medium">
            Regístrate gratis
          </Link>
        </p>
      </div>
    </div>
  );
}
