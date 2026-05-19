import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* Nav */}
      <nav className="border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="font-mono text-lg font-bold tracking-tight">
            fract<span className="text-violet-400">kit</span>
          </span>
          <div className="flex items-center gap-6 text-sm text-white/60">
            <a href="#how" className="hover:text-white transition-colors">
              How it works
            </a>
            <a href="#results" className="hover:text-white transition-colors">
              Results
            </a>
            <a href="#pricing" className="hover:text-white transition-colors">
              Pricing
            </a>
            <a
              href="https://github.com/MousMou/fractkit-platform"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 pt-24 pb-20">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <Badge className="mb-6 bg-violet-500/20 text-violet-300 border-violet-500/30 hover:bg-violet-500/20">
            Validated on 6 real QPUs · p=0.011
          </Badge>
          <h1 className="text-5xl sm:text-6xl font-bold leading-tight tracking-tight mb-6">
            Quantum noise mitigation.
            <br />
            <span className="text-violet-400">Zero extra shots.</span>
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mb-10">
            noisebridge corrects measurement errors using a spiking neural network centering
            matrix. One API call, under 1 ms, no additional QPU time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="bg-violet-600 hover:bg-violet-500 text-white px-8">
              Get your API key →
            </Button>
            <a
              href="https://pypi.org/project/noisebridge/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg border border-white/20 bg-transparent px-8 text-sm font-medium text-white transition-colors hover:bg-white/10 h-9"
            >
              pip install noisebridge
            </a>
          </div>

          {/* Code snippet */}
          <div className="mt-14 w-full max-w-xl text-left">
            <pre className="bg-white/5 border border-white/10 rounded-xl p-5 text-sm font-mono text-white/80 overflow-x-auto">
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
      </section>

      {/* Stats bar */}
      <section id="results" className="border-y border-white/10 bg-white/[0.02] py-12 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {STATS.map((s) => (
            <div key={s.device}>
              <div className="text-3xl font-bold text-violet-400">{s.value}</div>
              <div className="text-sm text-white/70 mt-1">{s.label}</div>
              <div className="text-xs text-white/40 mt-0.5">{s.device}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-14">How it works</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {HOW.map((h) => (
              <div key={h.step} className="flex flex-col gap-3">
                <span className="font-mono text-4xl font-bold text-violet-500/40">{h.step}</span>
                <h3 className="text-lg font-semibold">{h.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{h.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 bg-white/[0.02] border-t border-white/10">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Pricing</h2>
          <p className="text-center text-white/50 mb-14 text-sm">
            Start free. Scale when you need to.
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            {PRICING.map((p) => (
              <Card
                key={p.tier}
                className={`relative flex flex-col border ${
                  p.highlight
                    ? "border-violet-500 bg-violet-950/30"
                    : "border-white/10 bg-white/[0.03]"
                }`}
              >
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-violet-600 text-white border-0 text-xs">
                      Most popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-base font-semibold">{p.tier}</CardTitle>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-bold text-white">{p.price}</span>
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
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-8 mt-auto">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/30">
          <span className="font-mono">
            fract<span className="text-violet-400/60">kit</span> © 2026
          </span>
          <div className="flex gap-6">
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
