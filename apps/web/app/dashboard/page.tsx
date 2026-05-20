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

/** Infer n from the bit-string keys in a counts dict. Returns 0 if empty or inconsistent. */
function inferN(counts: Record<string, number>): number {
  const keys = Object.keys(counts);
  if (!keys.length) return 0;
  const len = keys[0].length;
  return keys.every((k) => k.length === len) ? len : 0;
}

function UsageMeter({ used, limit }: { used: number; limit: number | null }) {
  if (limit === null) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1 rounded-full" style={{ background: "rgba(124,58,237,0.15)" }}>
          <div className="h-full rounded-full" style={{ width: "100%", background: "linear-gradient(90deg,#7c3aed,#06b6d4)" }} />
        </div>
        <span className="text-xs text-white/30 flex-shrink-0">∞</span>
      </div>
    );
  }
  const pct = Math.min(100, (used / limit) * 100);
  const color = pct >= 90 ? "#f87171" : pct >= 70 ? "#fb923c" : "#7c3aed";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-xs text-white/30 flex-shrink-0">{used} / {limit}</span>
    </div>
  );
}

const DEVICES = [
  { group: "IBM", items: ["ibm_marrakesh", "ibm_torino", "ibm_kingston"] },
  { group: "IQM", items: ["iqm_garnet", "iqm_emerald", "iqm_spark"] },
  { group: "Rigetti", items: ["rigetti_cepheus", "rigetti_aspen_m3"] },
];

export default function DashboardPage() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [me, setMe] = useState<MeData | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);
  const [meError, setMeError] = useState<string | null>(null);

  // Quick correction widget state
  const [countsInput, setCountsInput] = useState('{"00": 480, "11": 520}');
  const [nInput, setNInput] = useState("2");
  const [nAutoDetected, setNAutoDetected] = useState(true);
  const [device, setDevice] = useState("ibm_marrakesh");
  const [method, setMethod] = useState("rem_snn");
  const [correcting, setCorrecting] = useState(false);
  const [correctResult, setCorrectResult] = useState<CorrectResult | null>(null);
  const [correctError, setCorrectError] = useState<string | null>(null);
  const [countsJsonError, setCountsJsonError] = useState<string | null>(null);

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
      setMeError("No se pudo cargar la cuenta. Verifica tu conexión.");
    } finally {
      setLoadingMe(false);
    }
  }, [router]);

  useEffect(() => {
    const key = localStorage.getItem("fk_api_key");
    if (!key) { router.push("/login"); return; }
    setApiKey(key);
    fetchMe(key);
  }, [fetchMe, router]);

  // Auto-detect n whenever counts JSON changes
  function handleCountsChange(val: string) {
    setCountsInput(val);
    setCorrectResult(null);
    setCorrectError(null);
    try {
      const parsed = JSON.parse(val);
      setCountsJsonError(null);
      const detected = inferN(parsed);
      if (detected > 0 && nAutoDetected) {
        setNInput(String(detected));
      }
    } catch {
      setCountsJsonError("JSON inválido");
    }
  }

  function handleNChange(val: string) {
    setNInput(val);
    setNAutoDetected(false); // user overrode auto-detect
  }

  async function handleCorrect(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKey) return;
    setCorrectError(null);
    setCorrectResult(null);

    // Parse and validate counts
    let counts: Record<string, number>;
    try {
      counts = JSON.parse(countsInput);
    } catch {
      setCorrectError("El JSON de counts no es válido.");
      return;
    }

    const n = parseInt(nInput, 10);
    if (!Number.isFinite(n) || n < 1 || n > 20) {
      setCorrectError("n debe estar entre 1 y 20.");
      return;
    }

    // Validate n vs. bitstring length
    const keyLengths = [...new Set(Object.keys(counts).map((k) => k.length))];
    if (keyLengths.length > 0 && !keyLengths.includes(n)) {
      setCorrectError(
        `Las claves de counts tienen longitud ${keyLengths[0]} (${keyLengths[0]} qubits) pero n=${n}. Ajusta n o los counts.`
      );
      return;
    }

    setCorrecting(true);
    try {
      const res = await fetch(`${API_URL}/v1/correct`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
        body: JSON.stringify({ counts, n, device, method }),
      });

      // Safe JSON parse — a 500 from Lambda may not always be valid JSON
      let data: Record<string, unknown> = {};
      try { data = await res.json(); } catch { /* ignore */ }

      if (!res.ok) {
        const detail = (data.detail as string) ?? `Error del servidor (${res.status})`;
        setCorrectError(detail);
        return;
      }
      setCorrectResult(data as unknown as CorrectResult);
      if (apiKey) fetchMe(apiKey);
    } catch {
      setCorrectError("No se pudo contactar la API. Verifica tu conexión.");
    } finally {
      setCorrecting(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("fk_api_key");
    router.push("/");
  }

  if (loadingMe) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#050510" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-9 h-9 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin" />
          <span className="text-white/30 text-sm font-mono">cargando dashboard…</span>
        </div>
      </div>
    );
  }

  const tierColor = me?.tier === "pro" ? "#a78bfa" : me?.tier === "enterprise" ? "#67e8f9" : "rgba(255,255,255,0.45)";
  const tierBg   = me?.tier === "pro" ? "rgba(124,58,237,0.15)" : me?.tier === "enterprise" ? "rgba(6,182,212,0.1)" : "rgba(255,255,255,0.05)";

  return (
    <div className="min-h-screen" style={{ background: "#050510" }}>
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 70% 45% at 50% 0%, rgba(124,58,237,0.10) 0%, transparent 65%)",
      }} />

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 px-6 py-3.5" style={{
        background: "rgba(5,5,16,0.88)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-mono text-base font-bold tracking-tight">
            fract<span className="text-violet-400">kit</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-xs text-white/25 font-mono hidden sm:block">{me?.key_prefix}</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-widest"
              style={{ background: tierBg, color: tierColor, border: `1px solid ${tierColor}25` }}>
              {me?.tier ?? "free"}
            </span>
            <button onClick={handleLogout}
              className="text-xs text-white/30 hover:text-white/60 transition-colors font-medium">
              Salir
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-10">
        {meError && (
          <div className="mb-8 px-4 py-3 rounded-xl text-sm text-red-300 flex items-center gap-3"
            style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
              <circle cx="8" cy="8" r="7" stroke="#f87171" strokeWidth="1.5"/>
              <path d="M8 5v3.5M8 11h.01" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {meError}
          </div>
        )}

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="mb-8 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Dashboard</h1>
            {me?.email && <p className="text-white/30 text-sm mt-0.5">{me.email}</p>}
          </div>
          <div className="flex items-center gap-2">
            <span className="live-dot" />
            <span className="text-xs text-white/25 font-mono">API activa</span>
          </div>
        </div>

        {/* ── Stats ───────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {([
            {
              label: "Hoy",
              value: me?.requests_today ?? 0,
              sub: me?.daily_limit ? `de ${me.daily_limit} límite` : "sin límite",
              icon: (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1v6l3 2" stroke="#7c3aed" strokeWidth="1.4" strokeLinecap="round"/>
                  <circle cx="7" cy="7" r="6" stroke="#7c3aed" strokeWidth="1.4"/>
                </svg>
              ),
              accent: "#7c3aed",
            },
            {
              label: "Total",
              value: me?.requests_total ?? 0,
              sub: "todas las épocas",
              icon: (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 10l3-3 2 2 4-5 3 3" stroke="#06b6d4" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ),
              accent: "#06b6d4",
            },
            {
              label: "Tier",
              value: (me?.tier ?? "free").charAt(0).toUpperCase() + (me?.tier ?? "free").slice(1),
              sub: me?.tier === "free" ? "100 req/día" : "ilimitado",
              icon: (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1l1.8 3.6L13 5.5l-3 2.9.7 4.1L7 10.5 3.3 12.5l.7-4.1L1 5.5l4.2-.9L7 1z"
                    stroke={tierColor} strokeWidth="1.3" fill="none"/>
                </svg>
              ),
              accent: tierColor,
            },
            {
              label: "Último uso",
              value: me?.last_request_at
                ? new Date(me.last_request_at).toLocaleDateString("es", { day: "2-digit", month: "short" })
                : "Nunca",
              sub: me?.last_request_at
                ? new Date(me.last_request_at).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })
                : "—",
              icon: (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="2" width="12" height="10" rx="1.5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.4"/>
                  <path d="M1 5h12" stroke="rgba(255,255,255,0.3)" strokeWidth="1.4"/>
                  <path d="M4 1v2M10 1v2" stroke="rgba(255,255,255,0.3)" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              ),
              accent: "rgba(255,255,255,0.35)",
            },
          ] as const).map((s, i) => (
            <div key={i} className="rounded-2xl p-4 flex flex-col gap-2"
              style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/30 font-semibold uppercase tracking-widest">{s.label}</span>
                <span className="opacity-70">{s.icon}</span>
              </div>
              <span className="text-2xl font-extrabold leading-none" style={{ color: s.accent }}>
                {s.value}
              </span>
              <span className="text-xs text-white/20">{s.sub}</span>
            </div>
          ))}
        </div>

        {/* Usage bar */}
        {me && me.tier === "free" && me.daily_limit !== null && (
          <div className="mb-6 px-5 py-4 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-sm font-semibold text-white/50">Cuota diaria</span>
              {me.requests_today >= me.daily_limit * 0.8 && me.requests_today < me.daily_limit && (
                <span className="text-xs text-orange-400 font-semibold">Casi al límite</span>
              )}
              {me.requests_today >= me.daily_limit && (
                <span className="text-xs text-red-400 font-semibold">Límite alcanzado</span>
              )}
            </div>
            <UsageMeter used={me.requests_today} limit={me.daily_limit} />
            <div className="mt-3">
              <Link href="/#pricing"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors">
                Actualiza a Pro para requests ilimitados →
              </Link>
            </div>
          </div>
        )}

        {/* ── Main grid ───────────────────────────────────────────────────── */}
        <div className="grid sm:grid-cols-2 gap-5">

          {/* Quick Correction */}
          <div className="rounded-2xl p-6"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-2 mb-5">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 8h3l2-5 2 10 2-5h3" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h2 className="text-sm font-bold text-white">Corrección rápida</h2>
            </div>

            <form onSubmit={handleCorrect} className="flex flex-col gap-3.5">
              {/* Counts */}
              <div>
                <label className="block text-xs font-semibold text-white/35 mb-1.5 uppercase tracking-widest">
                  Counts (JSON)
                </label>
                <textarea
                  value={countsInput}
                  onChange={(e) => handleCountsChange(e.target.value)}
                  rows={3}
                  spellCheck={false}
                  className="w-full px-3 py-2.5 rounded-xl text-xs font-mono text-white/80 placeholder-white/20 outline-none resize-none transition-all focus:ring-1"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${countsJsonError ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.08)"}`,
                  }}
                />
                {countsJsonError && (
                  <p className="text-red-400 text-xs mt-1">{countsJsonError}</p>
                )}
              </div>

              {/* n + device */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-white/35 mb-1.5 uppercase tracking-widest">
                    Qubits (n)
                    {nAutoDetected && (
                      <span className="ml-1.5 normal-case text-violet-400/70 font-normal">auto</span>
                    )}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={nInput}
                    onChange={(e) => handleNChange(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none transition-all focus:ring-1 focus:ring-violet-500/50"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                  />
                  <p className="text-white/20 text-xs mt-1">máx. 20</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/35 mb-1.5 uppercase tracking-widest">
                    Device
                  </label>
                  <select
                    value={device}
                    onChange={(e) => setDevice(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none transition-all focus:ring-1 focus:ring-violet-500/50"
                    style={{ background: "rgba(30,20,50,0.95)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    {DEVICES.map(({ group, items }) => (
                      <optgroup key={group} label={group}>
                        {items.map((d) => <option key={d} value={d}>{d}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>

              {/* Method */}
              <div>
                <label className="block text-xs font-semibold text-white/35 mb-1.5 uppercase tracking-widest">
                  Método
                </label>
                <div className="flex gap-2">
                  {(["rem_snn", "rem", "snn"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMethod(m)}
                      className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: method === m ? "rgba(124,58,237,0.25)" : "rgba(255,255,255,0.03)",
                        border: `1px solid ${method === m ? "rgba(124,58,237,0.5)" : "rgba(255,255,255,0.07)"}`,
                        color: method === m ? "#a78bfa" : "rgba(255,255,255,0.35)",
                      }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {correctError && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl"
                  style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)" }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0 mt-0.5">
                    <circle cx="7" cy="7" r="6" stroke="#f87171" strokeWidth="1.4"/>
                    <path d="M7 4.5v3M7 9.5h.01" stroke="#f87171" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                  <p className="text-red-400 text-xs leading-relaxed">{correctError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={correcting || !!countsJsonError}
                className="shimmer-btn w-full inline-flex items-center justify-center h-10 rounded-xl text-sm font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {correcting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                    Corrigiendo…
                  </span>
                ) : "Ejecutar corrección →"}
              </button>
            </form>

            {/* Result */}
            {correctResult && (
              <div className="mt-4 rounded-xl p-4"
                style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.18)" }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-violet-400 flex items-center gap-1.5">
                    <span className="live-dot" style={{ width: 6, height: 6 }} />
                    Output corregido
                  </span>
                  <span className="text-xs text-white/25 font-mono">{correctResult.latency_ms.toFixed(1)} ms</span>
                </div>
                <div className="space-y-2">
                  {Object.entries(correctResult.corrected)
                    .filter(([, prob]) => prob > 0.0001)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 8)
                    .map(([state, prob]) => (
                      <div key={state} className="flex items-center gap-3">
                        <code className="text-xs font-mono text-white/50 w-20 flex-shrink-0">{state}</code>
                        <div className="flex-1 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                          <div className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${(prob * 100).toFixed(1)}%`,
                              background: "linear-gradient(90deg,#7c3aed,#06b6d4)",
                            }} />
                        </div>
                        <span className="text-xs font-mono text-white/40 w-10 text-right flex-shrink-0">
                          {(prob * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4">
            {/* Account */}
            <div className="rounded-2xl p-6"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-2 mb-5">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <circle cx="7.5" cy="5" r="2.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.4"/>
                  <path d="M2 13c0-2.76 2.46-5 5.5-5s5.5 2.24 5.5 5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
                <h2 className="text-sm font-bold text-white">Cuenta</h2>
              </div>
              <dl className="space-y-3.5">
                {[
                  { label: "API Key", value: me?.key_prefix, mono: true },
                  { label: "Email", value: me?.email || "—", mono: false },
                  {
                    label: "Tier",
                    value: (me?.tier ?? "free").charAt(0).toUpperCase() + (me?.tier ?? "free").slice(1),
                    mono: false,
                    color: tierColor,
                  },
                  { label: "Miembro desde", value: me?.created_at ? formatDate(me.created_at).split(",")[0] : "—", mono: false },
                ].map(({ label, value, mono, color }) => (
                  <div key={label} className="flex items-start justify-between gap-4">
                    <dt className="text-xs text-white/30 flex-shrink-0">{label}</dt>
                    <dd className={`text-sm text-right break-all ${mono ? "font-mono text-white/60" : "text-white/60"}`}
                      style={color ? { color } : undefined}>
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Resources */}
            <div className="rounded-2xl p-6"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-2 mb-4">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <path d="M2 11V4a1 1 0 011-1h5l3 3v5a1 1 0 01-1 1H3a1 1 0 01-1-1z" stroke="rgba(255,255,255,0.4)" strokeWidth="1.4"/>
                  <path d="M8 3v3h3" stroke="rgba(255,255,255,0.4)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h2 className="text-sm font-bold text-white">Recursos</h2>
              </div>
              <div className="space-y-2.5">
                {[
                  { label: "Docs de la API", href: `${API_URL}/docs` },
                  { label: "GitHub", href: "https://github.com/MousMou/fractkit-platform" },
                  { label: "PyPI: noisebridge", href: "https://pypi.org/project/noisebridge/" },
                  { label: "Zenodo", href: "https://zenodo.org/doi/10.5281/zenodo.20157839" },
                ].map(({ label, href }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between group text-sm text-white/35 hover:text-violet-400 transition-colors">
                    <span>{label}</span>
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none"
                      className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <path d="M2 9L9 2M9 2H5M9 2v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            {/* Upgrade CTA */}
            {me?.tier === "free" && (
              <div className="rounded-2xl p-6 relative overflow-hidden"
                style={{
                  background: "rgba(124,58,237,0.07)",
                  border: "1px solid rgba(124,58,237,0.22)",
                  boxShadow: "0 0 50px rgba(124,58,237,0.07)",
                }}>
                <div className="absolute top-0 right-0 w-32 h-32 opacity-10"
                  style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)" }} />
                <p className="text-sm font-bold text-white mb-0.5">Go Pro · $49/mes</p>
                <p className="text-xs text-white/35 mb-4">Requests ilimitados, todos los devices, soporte prioritario.</p>
                <Link href="/#pricing"
                  className="shimmer-btn inline-flex items-center justify-center w-full h-9 rounded-xl text-sm font-bold text-white">
                  Actualizar a Pro →
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
