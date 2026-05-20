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
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
}

function detectN(counts: Record<string, number>): number | null {
  const keys = Object.keys(counts);
  if (keys.length === 0) return null;
  const len = keys[0].length;
  if (keys.every(k => k.length === len && /^[01]+$/.test(k))) return len;
  return null;
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ me, onLogout }: { me: MeData | null; onLogout: () => void }) {
  const tierColor = me?.tier === "pro" ? "#a78bfa" : me?.tier === "enterprise" ? "#67e8f9" : "rgba(255,255,255,0.4)";
  const pct = me?.daily_limit ? Math.min(100, ((me.requests_today ?? 0) / me.daily_limit) * 100) : 0;

  return (
    <aside className="fixed left-0 top-0 h-full w-56 flex flex-col z-40"
      style={{ background: "rgba(5,5,16,0.95)", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
      {/* Logo */}
      <div className="px-5 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <Link href="/" className="font-mono text-lg font-bold tracking-tight">
          fract<span className="text-violet-400">kit</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {[
          { label: "Dashboard", href: "/dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", active: true },
          { label: "API Docs", href: `${API_URL}/docs`, icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", external: true },
          { label: "GitHub", href: "https://github.com/MousMou/fractkit-platform", icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4", external: true },
          { label: "PyPI", href: "https://pypi.org/project/noisebridge/", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4", external: true },
          { label: "Zenodo", href: "https://zenodo.org/doi/10.5281/zenodo.20157839", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253", external: true },
        ].map(({ label, href, icon, active, external }) => (
          <a key={label} href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors group"
            style={{ background: active ? "rgba(124,58,237,0.12)" : "transparent", color: active ? "#a78bfa" : "rgba(255,255,255,0.45)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
              <path d={icon} />
            </svg>
            {label}
          </a>
        ))}
      </nav>

      {/* Quota mini-bar */}
      {me && me.tier === "free" && me.daily_limit && (
        <div className="px-4 py-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex justify-between text-xs text-white/30 mb-1.5">
            <span>Daily quota</span>
            <span>{me.requests_today}/{me.daily_limit}</span>
          </div>
          <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct > 80 ? "#f87171" : "#7c3aed" }} />
          </div>
        </div>
      )}

      {/* User section */}
      <div className="px-4 py-4 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: "rgba(124,58,237,0.2)", color: "#a78bfa" }}>
            {me?.email?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white/60 truncate">{me?.email ?? "—"}</p>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
              style={{ background: "rgba(124,58,237,0.15)", color: tierColor }}>
              {me?.tier ?? "free"}
            </span>
          </div>
        </div>
        <button onClick={onLogout}
          className="w-full text-xs text-white/30 hover:text-white/70 transition-colors py-1.5 rounded-lg text-left px-2"
          style={{ background: "rgba(255,255,255,0.03)" }}>
          Log out
        </button>
      </div>
    </aside>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [me, setMe] = useState<MeData | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);
  const [meError, setMeError] = useState<string | null>(null);

  const [countsInput, setCountsInput] = useState('{"00": 480, "11": 520}');
  const [nInput, setNInput] = useState("2");
  const [nAuto, setNAuto] = useState(true);
  const [device, setDevice] = useState("ibm_marrakesh");
  const [method, setMethod] = useState<"rem_snn" | "rem">("rem_snn");
  const [correcting, setCorrecting] = useState(false);
  const [correctResult, setCorrectResult] = useState<CorrectResult | null>(null);
  const [correctError, setCorrectError] = useState<string | null>(null);
  const [countsJsonError, setCountsJsonError] = useState<string | null>(null);

  const fetchMe = useCallback(async (key: string) => {
    setLoadingMe(true);
    setMeError(null);
    try {
      const res = await fetch(`${API_URL}/v1/me`, { headers: { "X-API-Key": key } });
      if (res.status === 401) { localStorage.removeItem("fk_api_key"); router.push("/login"); return; }
      setMe(await res.json());
    } catch { setMeError("Could not load account data."); }
    finally { setLoadingMe(false); }
  }, [router]);

  useEffect(() => {
    const key = localStorage.getItem("fk_api_key");
    if (!key) { router.push("/login"); return; }
    setApiKey(key);
    fetchMe(key);
  }, [fetchMe, router]);

  function handleCountsChange(val: string) {
    setCountsInput(val);
    setCountsJsonError(null);
    try {
      const parsed = JSON.parse(val);
      if (nAuto) {
        const detected = detectN(parsed);
        if (detected) setNInput(String(detected));
      }
    } catch { setCountsJsonError("Invalid JSON"); }
  }

  async function handleCorrect(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKey) return;
    setCorrectError(null);
    setCorrectResult(null);

    let counts: Record<string, number>;
    try { counts = JSON.parse(countsInput); }
    catch { setCorrectError("Invalid JSON in counts field."); return; }

    const n = parseInt(nInput);
    const keyLen = Object.keys(counts)[0]?.length;
    if (keyLen && keyLen !== n) {
      setCorrectError(`n=${n} but counts keys have ${keyLen} bits. Set n=${keyLen} to match.`);
      return;
    }

    setCorrecting(true);
    try {
      const res = await fetch(`${API_URL}/v1/correct`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
        body: JSON.stringify({ counts, n, device, method }),
      });
      let data: { corrected?: Record<string,number>; latency_ms?: number; method?: string; detail?: string };
      try { data = await res.json(); } catch { setCorrectError(`Server error (${res.status})`); return; }
      if (!res.ok) { setCorrectError(data.detail ?? `Server error (${res.status})`); return; }
      setCorrectResult(data as CorrectResult);
      if (apiKey) fetchMe(apiKey);
    } catch { setCorrectError("Request failed. Check your connection."); }
    finally { setCorrecting(false); }
  }

  function handleLogout() { localStorage.removeItem("fk_api_key"); router.push("/"); }

  if (loadingMe) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#050510" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
          <span className="text-white/30 text-sm">Loading dashboard…</span>
        </div>
      </div>
    );
  }

  const tierColor = me?.tier === "pro" ? "#a78bfa" : me?.tier === "enterprise" ? "#67e8f9" : "rgba(255,255,255,0.5)";

  return (
    <div className="min-h-screen" style={{ background: "#050510" }}>
      <Sidebar me={me} onLogout={handleLogout} />

      {/* Main content — offset by sidebar width */}
      <main className="ml-56 min-h-screen">
        {/* Top bar */}
        <div className="sticky top-0 z-30 flex items-center justify-between px-8 py-4"
          style={{ background: "rgba(5,5,16,0.9)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/30 font-mono hidden sm:block">{me?.key_prefix}</span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest"
              style={{ background: "rgba(124,58,237,0.12)", color: tierColor, border: `1px solid ${tierColor}25` }}>
              {me?.tier ?? "free"}
            </span>
          </div>
        </div>

        <div className="px-8 py-8">
          {meError && (
            <div className="mb-6 p-4 rounded-xl text-sm text-red-300"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>{meError}</div>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Requests Today", value: me?.requests_today ?? 0, sub: me?.daily_limit ? `of ${me.daily_limit}` : "unlimited", color: "#7c3aed", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
              { label: "Total Requests", value: me?.requests_total ?? 0, sub: "all time", color: "#06b6d4", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
              { label: "Tier", value: (me?.tier ?? "free").charAt(0).toUpperCase() + (me?.tier ?? "free").slice(1), sub: me?.tier === "free" ? "100 req/day" : "unlimited", color: tierColor, icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" },
              { label: "Last Request", value: me?.last_request_at ? new Date(me.last_request_at).toLocaleDateString() : "Never", sub: me?.last_request_at ? new Date(me.last_request_at).toLocaleTimeString() : "—", color: "rgba(255,255,255,0.35)", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl p-5"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs text-white/35 font-semibold uppercase tracking-widest">{s.label}</span>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${s.color}18` }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={s.icon} />
                    </svg>
                  </div>
                </div>
                <span className="text-2xl font-extrabold leading-none block mb-1" style={{ color: s.color }}>{s.value}</span>
                <span className="text-xs text-white/25">{s.sub}</span>
              </div>
            ))}
          </div>

          {/* Main grid */}
          <div className="grid lg:grid-cols-5 gap-6">
            {/* Correction widget — 3 cols */}
            <div className="lg:col-span-3 rounded-2xl p-6"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(124,58,237,0.15)" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-base font-bold text-white">Quick Correction</h2>
              </div>

              <form onSubmit={handleCorrect} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-white/40 mb-1.5 uppercase tracking-widest">
                    Counts (JSON)
                  </label>
                  <textarea value={countsInput} onChange={(e) => handleCountsChange(e.target.value)}
                    rows={3} spellCheck={false}
                    className="w-full px-3 py-2.5 rounded-xl text-xs font-mono text-white/80 outline-none resize-none transition-all focus:ring-1 focus:ring-violet-500/50"
                    style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${countsJsonError ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.08)"}` }} />
                  {countsJsonError && <p className="text-red-400 text-xs mt-1">{countsJsonError}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-white/40 mb-1.5 uppercase tracking-widest">
                      Qubits (n) {nAuto && <span className="normal-case text-white/20 ml-1">auto</span>}
                    </label>
                    <input type="number" min={1} max={20} value={nInput}
                      onChange={(e) => { setNAuto(false); setNInput(e.target.value); }}
                      className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none transition-all focus:ring-1 focus:ring-violet-500/50"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }} />
                    <p className="text-white/20 text-xs mt-1">max 20</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/40 mb-1.5 uppercase tracking-widest">Device</label>
                    <select value={device} onChange={(e) => setDevice(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none transition-all focus:ring-1 focus:ring-violet-500/50"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <optgroup label="IBM">
                        {["ibm_marrakesh","ibm_torino","ibm_kingston"].map(d => <option key={d} value={d}>{d}</option>)}
                      </optgroup>
                      <optgroup label="IQM">
                        {["iqm_garnet","iqm_emerald","iqm_spark"].map(d => <option key={d} value={d}>{d}</option>)}
                      </optgroup>
                      <optgroup label="Rigetti">
                        {["rigetti_cepheus","rigetti_aspen_m3"].map(d => <option key={d} value={d}>{d}</option>)}
                      </optgroup>
                    </select>
                  </div>
                </div>

                {/* Method tabs — only rem_snn and rem (snn alone requires manual params) */}
                <div>
                  <label className="block text-xs font-semibold text-white/40 mb-1.5 uppercase tracking-widest">Method</label>
                  <div className="flex gap-2">
                    {(["rem_snn", "rem"] as const).map((m) => (
                      <button key={m} type="button" onClick={() => setMethod(m)}
                        className="px-4 py-2 rounded-lg text-xs font-semibold transition-all"
                        style={{
                          background: method === m ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.04)",
                          border: `1px solid ${method === m ? "rgba(124,58,237,0.5)" : "rgba(255,255,255,0.08)"}`,
                          color: method === m ? "#a78bfa" : "rgba(255,255,255,0.4)",
                        }}>
                        {m === "rem_snn" ? "REM + SNN ★" : "REM only"}
                      </button>
                    ))}
                  </div>
                  <p className="text-white/20 text-xs mt-1">
                    {method === "rem_snn" ? "Recommended — confusion matrix + SNN centering" : "Readout error mitigation only"}
                  </p>
                </div>

                {correctError && (
                  <div className="flex items-center gap-2 p-3 rounded-lg text-xs text-red-300"
                    style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {correctError}
                  </div>
                )}

                <button type="submit" disabled={correcting || !!countsJsonError}
                  className="shimmer-btn w-full inline-flex items-center justify-center h-11 rounded-xl text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed">
                  {correcting ? (
                    <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin mr-2" />Correcting…</>
                  ) : "Run correction →"}
                </button>
              </form>

              {correctResult && (
                <div className="mt-5 rounded-xl p-4" style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-violet-400">Corrected output</span>
                    <span className="text-xs text-white/30 font-mono">{correctResult.latency_ms.toFixed(1)} ms</span>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(correctResult.corrected)
                      .filter(([, p]) => p > 0.0001)
                      .sort(([, a], [, b]) => b - a)
                      .map(([state, prob]) => (
                        <div key={state} className="flex items-center gap-3">
                          <code className="text-xs font-mono text-white/60 w-20 flex-shrink-0">{state}</code>
                          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                            <div className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${(prob * 100).toFixed(1)}%`, background: "linear-gradient(90deg,#7c3aed,#06b6d4)" }} />
                          </div>
                          <span className="text-xs font-mono text-white/60 w-14 text-right flex-shrink-0">
                            {(prob * 100).toFixed(1)}%
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right column — 2 cols */}
            <div className="lg:col-span-2 space-y-4">
              {/* Account */}
              <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-2 mb-4">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"/>
                  </svg>
                  <h2 className="text-sm font-bold text-white">Account</h2>
                </div>
                <dl className="space-y-3 text-sm">
                  {[
                    { label: "API Key", value: me?.key_prefix },
                    { label: "Email", value: me?.email || "—" },
                    { label: "Tier", value: (me?.tier ?? "free").charAt(0).toUpperCase() + (me?.tier ?? "free").slice(1) },
                    { label: "Member since", value: me?.created_at ? formatDate(me.created_at).split(",")[0] : "—" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-start justify-between gap-4">
                      <dt className="text-white/35 text-xs flex-shrink-0">{label}</dt>
                      <dd className="text-white/65 font-mono text-xs text-right break-all">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Upgrade CTA */}
              {me?.tier === "free" && (
                <div className="rounded-2xl p-5"
                  style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", boxShadow: "0 0 30px rgba(124,58,237,0.06)" }}>
                  <p className="text-sm font-bold text-white mb-1">Go Pro · $49/month</p>
                  <p className="text-xs text-white/40 mb-4">Unlimited requests, all devices, priority support.</p>
                  <Link href="/#pricing"
                    className="shimmer-btn inline-flex items-center justify-center w-full h-9 rounded-xl text-xs font-bold text-white">
                    Upgrade to Pro →
                  </Link>
                </div>
              )}

              {/* Quick links */}
              <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-2 mb-4">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                  <h2 className="text-sm font-bold text-white">Quick Start</h2>
                </div>
                <div className="rounded-lg p-3 text-xs font-mono text-white/50 overflow-x-auto"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <pre>{`pip install noisebridge

from noisebridge import rem_snn_correct
corrected = rem_snn_correct(
  counts,
  n=2,
  device="ibm_marrakesh"
)`}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
