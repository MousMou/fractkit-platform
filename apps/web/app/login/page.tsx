"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function LoginPage() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const key = apiKey.trim();
    if (!key) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/v1/me`, {
        headers: { "X-API-Key": key },
      });

      if (res.status === 401) {
        setError("Invalid API key. Check the key and try again.");
        return;
      }
      if (!res.ok) {
        setError("Something went wrong. Please try again.");
        return;
      }

      // Valid key — store and go to dashboard
      localStorage.setItem("fk_api_key", key);
      router.push("/dashboard");
    } catch {
      setError("Could not reach the server. Try again in a moment.");
    } finally {
      setLoading(false);
    }
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
        <h1 className="text-2xl font-extrabold text-white mb-1 tracking-tight">
          Dashboard login
        </h1>
        <p className="text-white/40 text-sm mb-7">
          Enter your noisebridge API key to access your dashboard.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="apikey"
              className="block text-xs font-semibold text-white/50 mb-2 uppercase tracking-widest"
            >
              API Key
            </label>
            <input
              id="apikey"
              type="password"
              required
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="nb-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none transition-all duration-200 focus:ring-2 focus:ring-violet-500/50 font-mono"
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
            {loading ? "Verifying…" : "Open dashboard →"}
          </button>
        </form>

        <p className="text-center text-white/25 text-xs mt-6">
          Don&apos;t have a key?{" "}
          <Link href="/register" className="text-violet-400 hover:text-violet-300 transition-colors">
            Register for free
          </Link>
        </p>
      </div>
    </div>
  );
}
