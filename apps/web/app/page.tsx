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
  },
  {
    tier: "Pro",
    price: "$49",
    period: "/ month",
    features: ["Unlimited requests", "All devices", "REST API + CLI", "Priority support", "SLA 99.9%"],
    cta: "Start Pro",
    highlight: true,
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
  },
];

const TRUSTED = [
  { name: "IBM Quantum", abbr: "IBM" },
  { name: "IQM", abbr: "IQM" },
  { name: "Rigetti", abbr: "RIG" },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#050510] text-white">
      <NavBar />

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 pt-36 pb-24 overflow-hidden">
        {/* Dot grid background */}
        <div className="dot-grid absolute inset-0 opacity-40" />
        {/* Purple radial glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-violet-700/20 blur-[120px] pointer-events-none" />
        {/* Cyan accent glow */}
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] rounded-full bg-cyan-500/10 blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
          <Badge className="mb-6 bg-violet-500/20 text-violet-300 border-violet-500/40 hover:bg-violet-500/20">
            Validated on 6 real QPUs · p=0.011
          </Badge>

          <h1 className="text-[clamp(2.8rem,6vw,5rem)] font-extrabold leading-[1.1] tracking-tight mb-6">
            Quantum noise mitigation.
            <br />
            <span className="gradient-text">Zero extra shots.</span>
          </h1>

          <p className="text-xl text-white/60 max-w-2xl mb-10">
            noisebridge corrects measurement errors using a spiking neural network centering
            matrix. One API call, under 1 ms, no additional QPU time.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <button className="shimmer-btn inline-flex items-center justify-center rounded-lg px-8 h-11 text-sm font-semibold text-white shadow-lg shadow-violet-700/40">
              Get your API key →
            </button>
            <a
              href="https://pypi.org/project/noisebridge/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg border border-white/20 bg-white/5 px-8 h-11 text-sm font-medium text-white transition-colors hover:bg-white/10 font-mono"
            >
              pip install noisebridge
            </a>
          </div>

          {/* Code snippet */}
          <div className="mt-14 w-full max-w-xl text-left">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] overflow-hidden shadow-2xl shadow-violet-900/20">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10 bg-white/[0.03]">
                <span className="w-3 h-3 rounded-full bg-red-500/70" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <span className="w-3 h-3 rounded-full bg-green-500/70" />
              </div>
              <pre className="p-5 text-sm font-mono text-white/80 overflow-x-auto">
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

      {/* Trusted by */}
      <section className="py-10 px-6 border-y border-white/5">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-6">
          <p className="text-xs uppercase tracking-widest text-white/30 font-semibold">
            Validated on hardware from
          </p>
          <div className="flex flex-wrap items-center justify-center gap-10">
            {TRUSTED.map((t) => (
              <div
                key={t.name}
                className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors"
              >
                <div className="w-8 h-8 rounded-md bg-white/10 flex items-center justify-center text-xs font-bold font-mono text-violet-300">
                  {t.abbr}
                </div>
                <span className="text-sm font-semibold tracking-wide">{t.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="results" className="py-16 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-5">
          {STATS.map((s) => (
            <StatCard key={s.device} {...s} />
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-2">How it works</h2>
          <p className="text-center text-white/40 text-sm mb-14">Three steps, one millisecond.</p>
          <div className="grid sm:grid-cols-3 gap-8">
            {HOW.map((h) => (
              <div
                key={h.step}
                className="flex flex-col gap-3 p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-violet-500/30 transition-colors"
              >
                <span className="font-mono text-4xl font-extrabold gradient-text opacity-50">
                  {h.step}
                </span>
                <h3 className="text-lg font-semibold">{h.title}</h3>
                <p className="text-white/55 text-sm leading-relaxed">{h.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-950/10 to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto relative z-10">
          <h2 className="text-3xl font-bold text-center mb-2">Pricing</h2>
          <p className="text-center text-white/40 text-sm mb-14">Start free. Scale when you need to.</p>
          <div className="grid sm:grid-cols-3 gap-6 items-start">
            {PRICING.map((p) => (
              <Card
                key={p.tier}
                className={`relative flex flex-col border transition-all duration-300 ${
                  p.highlight
                    ? "border-violet-500/60 bg-gradient-to-b from-violet-950/60 to-violet-900/20 shadow-[0_0_40px_rgba(124,58,237,0.30)] scale-[1.02]"
                    : "border-white/10 bg-white/[0.03] hover:border-white/20"
                }`}
              >
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-violet-600 to-cyan-600 text-white border-0 text-xs shadow-lg">
                      Most popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-base font-semibold">{p.tier}</CardTitle>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span
                      className={`text-3xl font-extrabold ${
                        p.highlight ? "gradient-text" : "text-white"
                      }`}
                    >
                      {p.price}
                    </span>
                    <span className="text-white/40 text-sm">{p.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 gap-4">
                  <ul className="space-y-2 text-sm text-white/70 flex-1">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <span className="text-violet-400">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  {p.tier === "Pro" ? (
                    <CheckoutButton className="shimmer-btn w-full inline-flex items-center justify-center rounded-lg h-9 text-sm font-semibold text-white shadow-md shadow-violet-700/30">
                      {p.cta}
                    </CheckoutButton>
                  ) : (
                    <Button
                      className={
                        p.highlight
                          ? "bg-violet-600 hover:bg-violet-500 text-white w-full"
                          : "border-white/20 text-white hover:bg-white/10 bg-transparent w-full"
                      }
                      variant={p.highlight ? "default" : "outline"}
                    >
                      {p.cta}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto px-6 pt-0 pb-8">
        {/* Gradient separator */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-violet-500/40 to-transparent mb-8" />
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/30">
          <span className="font-mono">
            fract<span className="text-violet-400/60">kit</span> © 2026
          </span>
          <div className="flex flex-wrap justify-center gap-5">
            <a
              href="https://github.com/MousMou/fractkit-platform"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white/60 transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://pypi.org/project/noisebridge/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white/60 transition-colors"
            >
              PyPI
            </a>
            <a
              href="https://zenodo.org/doi/10.5281/zenodo.20157839"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white/60 transition-colors"
            >
              Zenodo
            </a>
            <a
              href="https://arxiv.org"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white/60 transition-colors"
            >
              arXiv
            </a>
            <a
              href="mailto:paratrabajomou@gmail.com"
              className="hover:text-white/60 transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
