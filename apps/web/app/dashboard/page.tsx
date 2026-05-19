"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface MeData {
  key_prefix: string;
  tier: string;
  daily_limit: number | null;
  requests_today: number;
  requests_total: number;
  last_request_at: string | null;
  created_at: string | null;
  email: string | null;
}

interface CorrectResult {
  corrected: Record<string, number>;
  latency_ms: number;
  method: string;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function UsageMeter({ used, limit }: { used: number; limit: number | null }) {
  if (limit === null) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(124,58,237,0.15)" }}>
          <div className="h-full rounded-full" style={{ width: "100%", background: "linear-gradient(90deg,#7c3aed,#06b6d4)" }} />
        </div>
        <span className="text-xs text-white/30 flex-shrink-0">Unlimited</span>
      </div>
    );
  }
  const pct = Math.min(100, (used / limit) * 100);
  const color = pct >= 90 ? "#f87171" : pct >= 70 ? "#fb923c" : "#7c3aed";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-xs text-white/30 flex-shrink-0">{used} / {limit}</span>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [me, setMe] = useState<MeData | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);
  const [meError, setMeError] = useState<string | null>(null);

  // Quick correction widget state
  const [countsInput, setCountsInput] = useState('{"00": 480, "11": 520}');
  const [nInput, setNInput] = useState("2");
  const [device, setDevice] = useState("ibm_marrakesh");
  const [correcting, setCorrecting] = useState(false);
  const [correctResult, setCorrectResult] = useState<CorrectResult | null>(null);
  const [correctError, setCorrectError] = useState<string | null>(null);

  const fetchMe = useCallback(async (key: string) => {
    setLoadingMe(true);
    setMeError(null);
    try {
      const res = await fetch(`${API_URL}/v1/me`, {
        headers: { "X-API-Key": key },
      });
      if (res.status === 401) {
        localStorage.removeItem("fk_api_key");
        router.push("/login");
        return;
      }
      const data = await res.json();
      setMe(data);
    } catch {
      setMeError("Could not load account data. Check your connection.");
    } finally {
      setLoadingMe(false);
    }
  }, [router]);

  useEffect(() => {
    const key = localStorage.getItem("fk_api_key");
    if (!key) {
      router.push("/login");
      return;
    }
    setApiKey(key);
    fetchMe(key);
  }, [fetchMe, router]);

  async function handleCorrect(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKey) return;
    setCorrectError(null);
    setCorrectResult(null);
    setCorrecting(true);

    let counts: Record<string, number>;
    try {
      counts = JSON.parse(countsInput);
    } catch {
      setCorrectError("Invalid JSON in counts field.");
      setCorrecting(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/v1/correct`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
        body: JSON.stringify({ counts, n: parseInt(nInput), device, method: "rem_snn" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCorrectError(data.detail ?? "Correction failed.");
        return;
      }
      setCorrectResult(data);
      // Refresh usage stats after a successful call
      if (apiKey) fetchMe(apiKey);
    } catch {
      setCorrectError("Request failed. Is the API running?");
    } finally {
      setCorrecting(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("fk_api_key");
    router.push("/");
  }

  // ── Skeleton loading ───────────────────────────────────────────────────────
  if (loadingMe) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#050510" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
          <span className="text-white/30 text-sm">Loading your dashboard…</span>
        </div>
      </div>
    );
  }

  const tierColor = me?.tier === "pro" ? "#a78bfa" : me?.tier === "enterprise" ? "#67e8f9" : "rgba(255,255,255,0.5)";
  const tierBg = me?.tier === "pro" ? "rgba(124,58,237,0.15)" : me?.tier === "enterprise" ? "rgba(6,182,212,0.1)" : "rgba(255,255,255,0.06)";

  return (
    <div className="min-h-screen" style={{ background: "#050510" }}>
      {/* Top glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(124,58,237,0.12) 0%, transparent 60%)",
        }}
      />

      {/* ── NavBar ─────────────────────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-50 px-6 py-4"
        style={{
          background: "rgba(5,5,16,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-mono text-lg font-bold tracking-tight">
            fract<span className="text-violet-400">kit</span>
          </Link>
          <div className="flex items-center gap-5">
            <span className="text-xs text-white/30 font-mono hidden sm:block">
              {me?.key_prefix}
            </span>
            <span
              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest"
              style={{ background: tierBg, color: tierColor, border: `1px solid ${tierColor}30` }}
            >
              {me?.tier ?? "free"}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-white/30 hover:text-white/70 transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        {meError && (
          <div
            className="mb-8 p-4 rounded-xl text-sm text-red-300"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
          >
            {meError}
          </div>
        )}

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-1">Dashboard</h1>
          {me?.email && (
            <p className="text-white/35 text-sm">{me.email}</p>
          )}
        </div>

        {/* ── Stats grid ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[
            {
              label: "Requests today",
              value: me?.requests_today ?? 0,
              sub: me?.daily_limit ? `of ${me.daily_limit} limit` : "unlimited",
              accent: "#7c3aed",
            },
            {
              label: "Requests total",
              value: me?.requests_total ?? 0,
              sub: "all time",
              accent: "#06b6d4",
            },
            {
              label: "Tier",
              value: (me?.tier ?? "free").charAt(0).toUpperCase() + (me?.tier ?? "free").slice(1),
              sub: me?.tier === "free" ? "100 req/day" : "unlimited",
              accent: tierColor,
            },
            {
              label: "Last request",
              value: me?.last_request_at ? new Date(me.last_request_at).toLocaleDateString() : "Never",
              sub: me?.last_request_at ? new Date(me.last_request_at).toLocaleTimeString() : "—",
              accent: "rgba(255,255,255,0.3)",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl p-5 flex flex-col gap-1"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <span className="text-xs text-white/35 font-semibold uppercase tracking-widest">{s.label}</span>
              <span
                className="text-2xl font-extrabold leading-none mt-1"
                style={{ color: s.accent }}
              >
                {s.value}
              </span>
              <span className="text-xs text-white/25">{s.sub}</span>
            </div>
          ))}
        </div>

        {/* Usage bar (only for free tier) */}
        {me && me.tier === "free" && me.daily_limit !== null && (
          <div
            className="mb-10 p-5 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-white/60">Daily quota</span>
              {me.requests_today >= me.daily_limit * 0.8 && me.requests_today < me.daily_limit && (
                <span className="text-xs text-orange-400 font-semibold">Running low</span>
              )}
              {me.requests_today >= me.daily_limit && (
                <span className="text-xs text-red-400 font-semibold">Limit reached</span>
              )}
            </div>
            <UsageMeter used={me.requests_today} limit={me.daily_limit} />
            <div className="mt-4">
              <Link
                href="/#pricing"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors"
              >
                Upgrade to Pro for unlimited requests →
              </Link>
            </div>
          </div>
        )}

        {/* ── Two-column: Quick correct + Account info ────────────────────── */}
        <div className="grid sm:grid-cols-2 gap-6">

          {/* Quick Correction Widget */}
          <div
            className="rounded-2xl p-6"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <h2 className="text-base font-bold text-white mb-5">Quick correction</h2>
            <form onSubmit={handleCorrect} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-white/40 mb-1.5 uppercase tracking-widest">
                  Counts (JSON)
                </label>
                <textarea
                  value={countsInput}
                  onChange={(e) => setCountsInput(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl text-xs font-mono text-white/80 placeholder-white/20 outline-none resize-none transition-all focus:ring-1 focus:ring-violet-500/50"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-white/40 mb-1.5 uppercase tracking-widest">
                    Qubits (n)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={nInput}
                    onChange={(e) => setNInput(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none transition-all focus:ring-1 focus:ring-violet-500/50"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/40 mb-1.5 uppercase tracking-widest">
                    Device
                  </label>
                  <select
                    value={device}
                    onChange={(e) => setDevice(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none transition-all focus:ring-1 focus:ring-violet-500/50"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    {[
                      "ibm_marrakesh", "ibm_torino", "ibm_kingston",
                      "iqm_garnet", "iqm_emerald", "iqm_spark",
                      "rigetti_cepheus", "rigetti_aspen_m3",
                    ].map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              {correctError && (
                <p className="text-red-400 text-xs">{correctError}</p>
              )}

              <button
                type="submit"
                disabled={correcting}
                className="shimmer-btn w-full inline-flex items-center justify-center h-10 rounded-xl text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {correcting ? "Correcting…" : "Run correction →"}
              </button>
            </form>

            {/* Result */}
            {correctResult && (
              <div
                className="mt-5 rounded-xl p-4"
                style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-violet-400">Corrected output</span>
                  <span className="text-xs text-white/30 font-mono">{correctResult.latency_ms.toFixed(1)} ms</span>
                </div>
                <div className="space-y-1.5">
                  {Object.entries(correctResult.corrected).map(([state, prob]) => (
                    <div key={state} className="flex items-center gap-3">
                      <code className="text-xs font-mono text-white/60 w-16 flex-shrink-0">{state}</code>
                      <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(prob * 100).toFixed(1)}%`,
                            background: "linear-gradient(90deg,#7c3aed,#06b6d4)",
                          }}
                        />
                      </div>
                      <span className="text-xs font-mono text-white/50 w-12 text-right flex-shrink-0">
                        {(prob * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Account info */}
          <div className="flex flex-col gap-4">
            <div
              className="rounded-2xl p-6"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <h2 className="text-base font-bold text-white mb-5">Account</h2>
              <dl className="space-y-4 text-sm">
                {[
                  { label: "API Key", value: me?.key_prefix },
                  { label: "Email", value: me?.email || "—" },
                  { label: "Tier", value: (me?.tier ?? "free").charAt(0).toUpperCase() + (me?.tier ?? "free").slice(1) },
                  { label: "Member since", value: me?.created_at ? formatDate(me.created_at).split(",")[0] : "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-start justify-between gap-4">
                    <dt className="text-white/35 flex-shrink-0">{label}</dt>
                    <dd className="text-white/70 font-mono text-right break-all">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Resources */}
            <div
              className="rounded-2xl p-6"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <h2 className="text-base font-bold text-white mb-4">Resources</h2>
              <div className="space-y-2.5 text-sm">
                {[
                  { label: "API docs", href: `${API_URL}/docs`, external: true },
                  { label: "GitHub", href: "https://github.com/MousMou/fractkit-platform", external: true },
                  { label: "PyPI: noisebridge", href: "https://pypi.org/project/noisebridge/", external: true },
                  { label: "Zenodo", href: "https://zenodo.org/doi/10.5281/zenodo.20157839", external: true },
                ].map(({ label, href, external }) => (
                  <a
                    key={label}
                    href={href}
                    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="flex items-center gap-2 text-white/40 hover:text-violet-400 transition-colors group"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="flex-shrink-0 opacity-40 group-hover:opacity-100 transition-opacity">
                      <path d="M2 10L10 2M10 2H5M10 2V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {label}
                  </a>
                ))}
              </div>
            </div>

            {/* Upgrade CTA (free tier only) */}
            {me?.tier === "free" && (
              <div
                className="rounded-2xl p-6"
                style={{
                  background: "rgba(124,58,237,0.08)",
                  border: "1px solid rgba(124,58,237,0.25)",
                  boxShadow: "0 0 40px rgba(124,58,237,0.08)",
                }}
              >
                <p className="text-sm font-semibold text-white mb-1">Go Pro · $49/month</p>
                <p className="text-xs text-white/40 mb-4">Unlimited requests, all devices, priority support.</p>
                <Link
                  href="/#pricing"
                  className="shimmer-btn inline-flex items-center justify-center w-full h-10 rounded-xl text-sm font-bold text-white"
                >
                  Upgrade to Pro →
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
