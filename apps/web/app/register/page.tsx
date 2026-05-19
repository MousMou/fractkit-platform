"use client";

import { useState } from "react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/v1/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail ?? "Registration failed. Try again.");
        return;
      }
      setApiKey(data.api_key);
    } catch {
      setError("Could not reach the server. Please try again.");
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

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: "#050510" }}
    >
      {/* Glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(124,58,237,0.18) 0%, transparent 70%)",
        }}
      />

      {/* Logo */}
      <Link
        href="/"
        className="relative z-10 font-mono text-xl font-bold tracking-tight mb-12 hover:opacity-80 transition-opacity"
      >
        fract<span className="text-violet-400">kit</span>
      </Link>

      <div
        className="relative z-10 w-full max-w-md rounded-2xl p-8"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        {!apiKey ? (
          <>
            <h1 className="text-2xl font-extrabold text-white mb-1 tracking-tight">
              Get your free API key
            </h1>
            <p className="text-white/40 text-sm mb-7">
              100 requests / day. No credit card required.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-white/50 mb-2 uppercase tracking-widest"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none transition-all duration-200 focus:ring-2 focus:ring-violet-500/50"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.10)",
                  }}
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="shimmer-btn w-full inline-flex items-center justify-center h-12 rounded-xl text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed mt-1"
              >
                {loading ? "Creating key…" : "Create free key →"}
              </button>
            </form>

            <p className="text-center text-white/25 text-xs mt-6">
              Already have a key?{" "}
              <Link href="/login" className="text-violet-400 hover:text-violet-300 transition-colors">
                Log in to dashboard
              </Link>
            </p>
          </>
        ) : (
          <>
            {/* Success state */}
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.4)" }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path
                    d="M3.5 9.5L7 13L14.5 5.5"
                    stroke="#a78bfa"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Key created!</h2>
                <p className="text-white/40 text-xs">Copy it now — it won&apos;t be shown again.</p>
              </div>
            </div>

            {/* Key display */}
            <div
              className="rounded-xl p-4 mb-5 flex items-center justify-between gap-3"
              style={{
                background: "rgba(124,58,237,0.08)",
                border: "1px solid rgba(124,58,237,0.25)",
              }}
            >
              <code className="text-violet-300 text-sm font-mono break-all">{apiKey}</code>
              <button
                onClick={handleCopy}
                className="flex-shrink-0 text-xs font-semibold text-white/50 hover:text-white transition-colors px-3 py-1.5 rounded-lg"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            {/* Quick start code */}
            <div
              className="rounded-xl overflow-hidden mb-6"
              style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}
            >
              <div
                className="flex items-center gap-2 px-4 py-2.5"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}
              >
                <span className="text-xs text-white/25 font-mono">quick start</span>
              </div>
              <pre className="p-4 text-xs font-mono text-white/60 overflow-x-auto leading-relaxed whitespace-pre-wrap">
{`curl -X POST https://api.fractkit.io/v1/correct \\
  -H "X-API-Key: ${apiKey}" \\
  -d '{"counts":{"00":480,"11":520},"n":2}'`}
              </pre>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/dashboard"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    localStorage.setItem("fk_api_key", apiKey);
                  }
                }}
                className="flex-1 inline-flex items-center justify-center h-11 rounded-xl text-sm font-bold text-white shimmer-btn"
              >
                Go to dashboard →
              </Link>
              <Link
                href="/"
                className="flex-1 inline-flex items-center justify-center h-11 rounded-xl text-sm font-semibold text-white/50 hover:text-white transition-colors"
                style={{ border: "1px solid rgba(255,255,255,0.10)" }}
              >
                Back to home
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
