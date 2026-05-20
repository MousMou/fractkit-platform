"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface MeData {
  key_prefix: string;
  tier: string;
  daily_limit: number | null;
  requests_today: number;
  requests_total: number;
  last_request_at: string | null;
  created_at: string | null;
  email: string | null;
}

export interface FKJob {
  id: string;
  timestamp: string;
  device: string;
  method: string;
  n: number;
  counts: Record<string, number>;
  corrected: Record<string, number>;
  latency_ms: number;
}

// ── Context ───────────────────────────────────────────────────────────────────
interface DashboardCtx {
  me: MeData | null;
  apiKey: string | null;
  loading: boolean;
  refreshMe: () => void;
  jobs: FKJob[];
  addJob: (j: FKJob) => void;
}

const Ctx = createContext<DashboardCtx>({
  me: null, apiKey: null, loading: true,
  refreshMe: () => {}, jobs: [], addJob: () => {},
});

export function useDashboard() { return useContext(Ctx); }

// ── Nav config ────────────────────────────────────────────────────────────────
const NAV = [
  {
    group: "Platform",
    items: [
      { label: "Overview", href: "/dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
      { label: "Jobs",     href: "/dashboard/jobs",    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
      { label: "Devices",  href: "/dashboard/devices", icon: "M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" },
    ],
  },
  {
    group: "Account",
    items: [
      { label: "Wallet",   href: "/dashboard/wallet",  icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" },
      { label: "API Keys", href: "/dashboard/keys",    icon: "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" },
    ],
  },
  {
    group: "Resources",
    items: [
      { label: "API Docs", href: `${API_URL}/docs`, icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", external: true },
      { label: "GitHub",   href: "https://github.com/MousMou/fractkit-platform", icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4", external: true },
      { label: "Zenodo",   href: "https://zenodo.org/doi/10.5281/zenodo.20157839", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253", external: true },
    ],
  },
];

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ onLogout }: { onLogout: () => void }) {
  const { me } = useDashboard();
  const pathname = usePathname();

  const pct = me?.daily_limit
    ? Math.min(100, ((me.requests_today ?? 0) / me.daily_limit) * 100)
    : 0;

  return (
    <aside className="fixed left-0 top-0 h-screen w-[220px] flex flex-col z-50 overflow-hidden"
      style={{ background: "#0d0d18", borderRight: "1px solid rgba(255,255,255,0.06)" }}>

      {/* Logo */}
      <div className="px-5 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <Link href="/" className="font-mono text-[17px] font-bold tracking-tight">
          fract<span className="text-violet-400">kit</span>
        </Link>
        <p className="text-[10px] text-white/25 mt-0.5 font-mono">quantum noise API</p>
      </div>

      {/* Credits pill */}
      {me && (
        <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5">Daily quota</p>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-lg font-extrabold text-white font-mono">
              {me.daily_limit !== null ? me.daily_limit - me.requests_today : "∞"}
            </span>
            <span className="text-[10px] text-white/30">
              {me.daily_limit !== null ? `/ ${me.daily_limit}` : "unlimited"}
            </span>
          </div>
          <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${pct}%`,
                background: pct > 85 ? "#f87171" : pct > 65 ? "#fb923c" : "linear-gradient(90deg,#7c3aed,#06b6d4)",
              }} />
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {NAV.map(({ group, items }) => (
          <div key={group}>
            <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest px-2 mb-1.5">
              {group}
            </p>
            <div className="space-y-0.5">
              {items.map(({ label, href, icon, external }) => {
                const isActive = external ? false : pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
                return (
                  <a key={label} href={href}
                    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors group"
                    style={{
                      background: isActive ? "rgba(124,58,237,0.15)" : "transparent",
                      color: isActive ? "#a78bfa" : "rgba(255,255,255,0.45)",
                    }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                      <path d={icon} />
                    </svg>
                    <span>{label}</span>
                    {external && (
                      <svg width="9" height="9" viewBox="0 0 9 9" fill="none" className="ml-auto opacity-30">
                        <path d="M1.5 7.5L7.5 1.5M7.5 1.5H3.5M7.5 1.5V5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </a>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="px-4 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#7c3aed,#06b6d4)", color: "#fff" }}>
            {me?.email?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-white/55 truncate leading-tight">{me?.email ?? "—"}</p>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider mt-0.5"
              style={{ background: "rgba(124,58,237,0.15)", color: "#a78bfa" }}>
              {me?.tier ?? "free"}
            </span>
          </div>
        </div>
        <button onClick={onLogout}
          className="w-full text-[12px] text-white/30 hover:text-red-400 transition-colors py-1.5 rounded-lg text-left px-2 flex items-center gap-2"
          style={{ background: "rgba(255,255,255,0.03)" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
          Log out
        </button>
      </div>
    </aside>
  );
}

// ── Topbar ────────────────────────────────────────────────────────────────────
export function DashboardTopbar({ title, crumb }: { title: string; crumb?: string }) {
  return (
    <div className="h-12 flex items-center px-6 sticky top-0 z-40"
      style={{ background: "rgba(9,9,16,0.85)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <nav className="flex items-center gap-2 text-[12px] text-white/30">
        <span>Dashboard</span>
        {crumb && (
          <>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M4 9l4-3-4-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-white/60 font-medium">{crumb}</span>
          </>
        )}
      </nav>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
export function StatCard({
  label, value, sub, iconPath, iconColor, iconBg,
}: {
  label: string; value: string | number; sub?: string;
  iconPath: string; iconColor: string; iconBg: string;
}) {
  return (
    <div className="rounded-2xl p-5 flex items-center gap-4"
      style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: iconBg }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={iconColor}
          strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d={iconPath} />
        </svg>
      </div>
      <div>
        <p className="text-[11px] text-white/35 font-semibold uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-extrabold text-white leading-tight">{value}</p>
        {sub && <p className="text-[11px] text-white/25 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Page title ────────────────────────────────────────────────────────────────
export function PageTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-7">
      <h1 className="text-3xl font-extrabold tracking-tight" style={{
        background: "linear-gradient(135deg, #22d3ee 0%, #a78bfa 60%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      }}>{title}</h1>
      {sub && <p className="text-white/35 text-sm mt-1.5">{sub}</p>}
    </div>
  );
}

// ── Shell provider ────────────────────────────────────────────────────────────
export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [me, setMe] = useState<MeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<FKJob[]>([]);

  const fetchMe = useCallback(async (key: string) => {
    try {
      const res = await fetch(`${API_URL}/v1/me`, { headers: { "X-API-Key": key } });
      if (res.status === 401) { localStorage.removeItem("fk_api_key"); router.push("/login"); return; }
      setMe(await res.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => {
    const key = localStorage.getItem("fk_api_key");
    if (!key) { router.push("/login"); return; }
    setApiKey(key);
    fetchMe(key);

    // Load saved jobs
    try {
      const saved = localStorage.getItem("fk_jobs");
      if (saved) setJobs(JSON.parse(saved));
    } catch { /* ignore */ }
  }, [fetchMe, router]);

  function addJob(j: FKJob) {
    setJobs(prev => {
      const updated = [j, ...prev].slice(0, 100); // keep last 100
      try { localStorage.setItem("fk_jobs", JSON.stringify(updated)); } catch { /* ignore */ }
      return updated;
    });
  }

  function handleLogout() {
    localStorage.removeItem("fk_api_key");
    router.push("/");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#090910" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin" />
          <span className="text-white/25 text-sm font-mono">loading…</span>
        </div>
      </div>
    );
  }

  return (
    <Ctx.Provider value={{ me, apiKey, loading, refreshMe: () => apiKey && fetchMe(apiKey), jobs, addJob }}>
      <div className="min-h-screen" style={{ background: "#090910" }}>
        <Sidebar onLogout={handleLogout} />
        <div className="ml-[220px] min-h-screen flex flex-col">
          {children}
        </div>
      </div>
    </Ctx.Provider>
  );
}
