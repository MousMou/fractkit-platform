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
                  border: tab === id ? "1px solid rgb