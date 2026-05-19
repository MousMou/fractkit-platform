import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckoutButton } from "@/components/CheckoutButton";
import { NavBar } from "@/components/NavBar";
import { StatCard } from "@/components/StatCard";

const STATS = [
  { value: "+42.9%", label: "GHZ fidelity", device: "IBM Marrakesh 50q" },
  { value: "2.08×", label: "LER reduction", device: "IQM Garnet" },
  { value: "1.91×", label: "LER reduction", device: "Rigetti Cepheus" },
  { value: "97%", label: "win rate", device: "63 circuits · IBM + IQM" },
];

const HOW = [
  {
    step: "01",
    title: "Send your counts",
    body: "POST your raw measurement counts, qubit count, and device ID to /v1/correct.",
  },
  {
    step: "02",
    title: "SNN centering matrix",
    body: "noisebridge computes W[i,j] = (δ(i,j) − 1/N) · W_scale in under 1 ms — no extra QPU shots.",
  },
  {
    step: "03",
    title: "Corrected counts back",
    body: "Receive mitigated probability distributions ready to feed into your analysis pipeline.",
  },
];

const PRICING = [
  {
    tier: "Free",
    price: "$0",
    period: "forever",
    features: ["100 requests / day", "All devices", "REST API + CLI", "Community support"],
    cta: "Get free key",
    highlight: false,
    accent: "white",
  },
  {
    tier: "Pro",
    price: "$49",
    period: "/ month",
    features: ["Unlimited requests", "All devices", "REST API + CLI", "Priority support", "SLA 99.9%"],
    cta: "Start Pro",
    highlight: true,
    accent: "purple",
  },
  {
    tier: "Enterprise",
    price: "Custom",
    period: "",
    features: [
      "Unlimited requests",
      "Private deployment",
      "Custom device profiles",
      "Dedicated support",
      "SLA 99.99%",
    ],
    cta: "Contact us",
    highlight: false,
    accent: "cyan",
  },
];

const TRUSTED = [
  { name: "IBM Quantum", abbr: "IBM" },
  { name: "IQM", abbr: "IQM" },
  { name: "Rigetti", abbr: "RIG" },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen text-white" style={{ background: "#050510" }}>
      <NavBar />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 pt-40 pb-28 overflow-hidden">
        {/* Line grid */}
        <div className="line-grid absolute inset-0" />
        {/* Hero radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124,58,237,0.30) 0%, transparent 70%)",
          }}
        />
        {/* Bottom fade */}
        <div
          className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent, #050510)" }}
        />

        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center gap-8">
          {/* Live badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold text-green-400 border border-green-500/25 bg-green-500/10">
            <span className="live-dot" />
            API live · &lt;1ms latency
          </div>

          {/* Headline */}
          <h1
            className="tracking-tight leading-[1.05]"
            style={{ fontSize: "clamp(3rem, 7vw, 6rem)", fontWeight: 900, letterSpacing: "-2px" }}
          >
            Quantum noise mitigation.
            <br />
            <span className="gradient-text">Zero extra shots.</span>
          </h1>

          <p className="text-lg sm:text-xl text-white/55 max-w-2xl leading-relaxed">
            noisebridge corrects measurement errors using a spiking neural network centering
            matrix. One API call, under 1 ms, no additional QPU time.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button className="shimmer-btn inline-flex items-center justify-center px-8 h-12 rounded-xl text-sm font-bold text-white shadow-xl shadow-violet-900/40">
              Get your API key →
            </button>
            <a
              href="https://pypi.org/project/noisebridge/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 h-12 rounded-xl border text-sm font-mono font-medium text-white/70 transition-all duration-200 hover:text-white hover:bg-white/5"
              style={{ borderColor: "rgba(255,255,255,0.12)" }}
            >
              pip install noisebridge
            </a>
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-3 text-sm text-white/40">
            <div className="flex -space-x-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-7 h-7 rounded-full border-2 border-[#050510]"
                  style={{ background: `rgba(124,58,237,${0.3 + i * 0.15})` }}
                />
              ))}
            </div>
            <span>12 researchers this week</span>
          </div>

          {/* Code block */}
          <div className="w-full max-w-xl text-left mt-4">
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
              }}
            >
              <div
                className="flex items-center gap-2 px-4 py-3"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}
              >
                <span className="w-3 h-3 rounded-full bg-red-500/60" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <span className="w-3 h-3 rounded-full bg-green-500/60" />
                <span className="ml-2 text-xs text-white/25 font-mono">terminal</span>
              </div>
              <pre className="p-5 text-sm font-mono text-white/75 overflow-x-auto leading-relaxed">
                {`curl -X POST https://api.fractkit.io/v1/correct \\
  -H "X-API-Key: fk_your_key" \\
  -d '{
    "counts": {"00": 480, "11": 520},
    "n": 2,
    "device": "ibm_marrakesh"
  }'`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUSTED BY ───────────────────────────────────────────────────── */}
      <section className="py-10 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-6">
          <p className="text-xs uppercase tracking-widest text-white/25 font-semibold">
            Validated on hardware from
          </p>
          <div className="flex flex-wrap items-center justify-center gap-12">
            {TRUSTED.map((t) => (
              <div key={t.name} className="flex items-center gap-3 group">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold font-mono text-violet-300 transition-colors duration-200 group-hover:text-violet-200"
                  style={{
                    background: "rgba(124,58,237,0.12)",
                    border: "1px solid rgba(124,58,237,0.2)",
                  }}
                >
                  {t.abbr}
                </div>
                <span className="text-sm font-semibold text-white/40 group-hover:text-white/70 transition-colors duration-200">
                  {t.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────────── */}
      <section id="results" className="py-20 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STATS.map((s) => (
            <StatCard key={s.device} {...s} />
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section id="how" className="py-24 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold tracking-tight mb-3" style={{ letterSpacing: "-1px" }}>
              How it works
            </h2>
            <p className="text-white/40 text-sm">Three steps, one millisecond.</p>
          </div>

          <div className="relative grid sm:grid-cols-3 gap-6">
            {/* Connector line (desktop) */}
            <div
              className="hidden sm:block absolute top-10 left-[calc(16.67%+12px)] right-[calc(16.67%+12px)] h-px pointer-events-none"
              style={{ background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.3), rgba(124,58,237,0.3), transparent)" }}
            />

            {HOW.map((h) => (
              <div
                key={h.step}
                className="relative flex flex-col gap-3 p-6 rounded-2xl overflow-hidden"
                style={{
                  borderLeft: "3px solid rgba(124,58,237,0.6)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderLeftWidth: "3px",
                  borderLeftColor: "rgba(124,58,237,0.6)",
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                {/* Ghost step number */}
                <span
                  className="absolute -top-4 -right-2 font-extrabold text-white/[0.06] select-none pointer-events-none leading-none"
                  style={{ fontSize: "120px" }}
                >
                  {h.step}
                </span>
                <span
                  className="font-mono text-xs font-bold tracking-widest gradient-text"
                  style={{ WebkitTextFillColor: "unset" }}
                >
                  STEP {h.step}
                </span>
                <h3 className="text-lg font-bold text-white">{h.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{h.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────────── */}
      <section
        id="pricing"
        className="py-24 px-6"
        style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold tracking-tight mb-3" style={{ letterSpacing: "-1px" }}>
              Pricing
            </h2>
            <p className="text-white/40 text-sm">Start free. Scale when you need to.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 items-start">
            {PRICING.map((p) => {
              const isProCard = p.tier === "Pro";
              const isEnterprise = p.tier === "Enterprise";
              const cardStyle = isProCard
                ? {
                    background: "rgba(124,58,237,0.10)",
                    border: "1px solid rgba(124,58,237,0.6)",
                    boxShadow: "0 0 60px rgba(124,58,237,0.20), 0 0 120px rgba(124,58,237,0.08)",
                  }
                : isEnterprise
                ? {
                    background: "rgba(6,182,212,0.04)",
                    border: "1px solid rgba(6,182,212,0.2)",
                  }
                : {
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.10)",
                  };

              return (
                <div
                  key={p.tier}
                  className={`relative flex flex-col rounded-2xl p-6 transition-all duration-300 ${
                    isProCard ? "sm:-translate-y-2" : ""
                  }`}
                  style={cardStyle}
                >
                  {isProCard && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-white"
                        style={{
                          background: "linear-gradient(90deg, #7c3aed, #06b6d4)",
                          boxShadow: "0 0 20px rgba(124,58,237,0.5)",
                        }}
                      >
                        Most popular
                      </span>
                    </div>
                  )}

                  {/* Top glow line on Pro */}
                  {isProCard && (
                    <div
                      className="absolute top-0 left-6 right-6 h-px"
                      style={{ background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.8), rgba(6,182,212,0.8), transparent)" }}
                    />
                  )}

                  <div className="mb-5 mt-2">
                    <div className="text-sm font-semibold text-white/60 mb-1">{p.tier}</div>
                    <div className="flex items-baseline gap-1">
                      <span
                        className={`font-extrabold leading-none ${isProCard ? "gradient-text" : "text-white"}`}
                        style={{ fontSize: "44px", letterSpacing: "-2px" }}
                      >
                        {p.price}
                      </span>
                      {p.period && (
                        <span className="text-white/35 text-sm ml-1">{p.period}</span>
                      )}
                    </div>
                  </div>

                  <ul className="space-y-2.5 text-sm mb-6 flex-1">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-white/65">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path
                            d="M2.5 7L5.5 10L11.5 4"
                            stroke={isProCard ? "#a78bfa" : isEnterprise ? "#67e8f9" : "rgba(255,255,255,0.4)"}
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>

                  {isProCard ? (
                    <CheckoutButton className="shimmer-btn w-full inline-flex items-center justify-center h-11 rounded-xl text-sm font-bold text-white">
                      {p.cta}
                    </CheckoutButton>
                  ) : isEnterprise ? (
                    <a
                      href="mailto:paratrabajomou@gmail.com"
                      className="w-full inline-flex items-center justify-center h-11 rounded-xl text-sm font-semibold text-cyan-400 transition-all duration-200 hover:bg-cyan-500/10"
                      style={{ border: "1px solid rgba(6,182,212,0.3)" }}
                    >
                      {p.cta}
                    </a>
                  ) : (
                    <button
                      className="w-full inline-flex items-center justify-center h-11 rounded-xl text-sm font-semibold text-white/70 transition-all duration-200 hover:text-white hover:bg-white/5"
                      style={{ border: "1px solid rgba(255,255,255,0.12)" }}
                    >
                      {p.cta}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="mt-auto px-6 pt-0 pb-10">
        <div
          className="h-px w-full mb-8"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.4), rgba(6,182,212,0.3), transparent)",
          }}
        />
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5">
          <span className="font-mono text-sm text-white/25">
            fract<span style={{ color: "rgba(167,139,250,0.5)" }}>kit</span> © 2026
          </span>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-white/30">
            {[
              { label: "GitHub", href: "https://github.com/MousMou/fractkit-platform", external: true },
              { label: "PyPI", href: "https://pypi.org/project/noisebridge/", external: true },
              { label: "Zenodo", href: "https://zenodo.org/doi/10.5281/zenodo.20157839", external: true },
              { label: "arXiv", href: "https://arxiv.org", external: true },
              { label: "Contact", href: "mailto:paratrabajomou@gmail.com", external: false },
            ].map((l) => (
              <a
                key={l.label}
                href={l.href}
                {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="hover:text-white/60 transition-colors duration-200"
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
