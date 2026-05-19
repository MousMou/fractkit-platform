"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  value: string;
  label: string;
  device: string;
}

function parseNumber(v: string): { prefix: string; num: number; suffix: string } {
  const m = v.match(/^([+]?)(\d+\.?\d*)([x×%]?)$/);
  if (!m) return { prefix: "", num: 0, suffix: v };
  return { prefix: m[1], num: parseFloat(m[2]), suffix: m[3] };
}

export function StatCard({ value, label, device }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const { prefix, num, suffix } = parseNumber(value);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
          obs.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const duration = 1200;
    const steps = 40;
    const step = num / steps;
    let current = 0;
    const id = setInterval(() => {
      current = Math.min(current + step, num);
      setCount(current);
      if (current >= num) clearInterval(id);
    }, duration / steps);
    return () => clearInterval(id);
  }, [started, num]);

  const display = started
    ? `${prefix}${Number.isInteger(num) ? Math.round(count) : count.toFixed(2)}${suffix}`
    : value;

  return (
    <div
      ref={ref}
      className="relative flex flex-col items-center p-6 rounded-2xl border border-violet-500/30 bg-violet-950/20
                 shadow-[0_0_24px_rgba(124,58,237,0.18)] hover:shadow-[0_0_36px_rgba(124,58,237,0.35)]
                 transition-shadow duration-300"
    >
      <div className="text-3xl font-extrabold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
        {display}
      </div>
      <div className="text-sm text-white/70 mt-1">{label}</div>
      <div className="text-xs text-white/40 mt-0.5">{device}</div>
    </div>
  );
}
