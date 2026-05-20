"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function RegisterPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [googleRegistered, setGoogleRegistered] = useState(false);

  // Auto-register when Google session appears
  useEffect(() => {
    if (session?.user?.email && !apiKey && !loading && !googleRegistered) {
      setGoogleRegistered(true);
      handleRegister(session.user.email);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  async function handleRegister(emailAddr: string) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/v1/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailAddr }),
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

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    await handleRegister(email);
  }

  function handleCopy() {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleGoToDashboard() {
    if (!apiKey) return;
    localStorage.setItem("fk_api_key", apiKey);
    router.push("/dashboard");
  }

  if (status === "loading" || (session && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#050510" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
          <span className="text-white/40 text-sm">
            {session ? "Creating your API key…" : "Loading…"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "#050510" }}>
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(124,58,237,0.18) 0%, transparent 70%)" }} />

      <Link href="/" className="relative z-10 font-mono text-xl font-bold tracking-tight mb-12 hover:opacity-80 transition-opacity">
        fract<span className="text-violet-400">kit</span>
      </Link>

      <div className="relative z-10 w-full max-w-md rounded-2xl p-8"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
        {!apiKey ? (
          <>
            <h1 className="text-2xl font-extrabold text-white mb-1 tracking-tight">Get your free API key</h1>
            <p className="text-white/40 text-sm mb-7">100 requests / day. No credit card required.</p>

            {/* Google button */}
            <button
              onClick={() => signIn("google")}
              className="w-full flex items-center justify-center gap-3 h-12 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 mb-4"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
              <span className="text-xs text-white/25">or use email</span>
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
            </div>

            <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-white/50 mb-2 uppercase tracking-widest">Email</label>
                <input id="email" type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none transition-all focus:ring-2 focus:ring-violet-500/50"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }} />
                <p className="text-white/25 text-xs mt-1.5">We&apos;ll email you a copy of your key.</p>
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button type="submit" disabled={loading}
                className="shimmer-btn w-full inline-flex items-center justify-center h-12 rounded-xl text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? "Creating key…" : "Create free key →"}
              </button>
            </form>

            <p className="text-center text-white/25 text-xs mt-6">
              Already have a key?{" "}
              <Link href="/login" className="text-violet-400 hover:text-violet-300 transition-colors">Log in</Link>
            </p>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.4)" }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M3.5 9.5L7 13L14.5 5.5" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Key created!</h2>
                <p className="text-white/40 text-xs">Copy it now — it won&apos;t be shown again.</p>
              </div>
            </div>

            <div className="rounded-xl p-4 mb-5 flex items-center justify-between gap-3"
              style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.25)" }}>
              <code className="text-violet-300 text-sm font-mono break-all">{apiKey}</code>
              <button onClick={handleCopy}
                className="flex-shrink-0 text-xs font-semibold text-white/50 hover:text-white transition-colors px-3 py-1.5 rounded-lg"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}>
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            <label className="flex items-start gap-3 cursor-pointer mb-5 p-3 rounded-xl"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 accent-violet-500 flex-shrink-0" />
              <span className="text-xs text-white/50 leading-relaxed">
                I&apos;ve copied my API key. I understand it won&apos;t be shown again.
              </span>
            </label>

            <button onClick={handleGoToDashboard} disabled={!confirmed}
              className="shimmer-btn w-full inline-flex items-center justify-center h-11 rounded-xl text-sm font-bold text-white disabled:opacity-30 disabled:cursor-not-allowed">
              Go to dashboard →
            </button>
          </>
        )}
      </div>
    </div>
  );
}
