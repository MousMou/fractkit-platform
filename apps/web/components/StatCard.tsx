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
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const duration = 1400;
    const steps = 50;
    const increment = num / steps;
    let current = 0;
    const id = setInterval(() => {
      current = Math.min(current + increment, num);
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
      style={{
        background: "linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(6,182,212,0.05) 100%)",
        border: "1px solid rgba(124,58,237,0.3)",
        boxShadow: "0 0 30px rgba(124,58,237,0.15)",
        transition: "box-shadow 0.3s ease, transform 0.3s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          "0 0 50px rgba(124,58,237,0.3), 0 0 80px rgba(124,58,237,0.1)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 30px rgba(124,58,237,0.15)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
      }}
      className="relative flex flex-col items-center justify-center text-center p-8 rounded-2xl overflow-hidden"
    >
      {/* subtle inner glow top */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.6), transparent)" }}
      />
      <div
        className="font-extrabold gradient-text leading-none mb-2"
        style={{ fontSize: "56px", letterSpacing: "-2px" }}
      >
        {display}
      </div>
      <div className="text-sm font-semibold text-white/70">{label}</div>
      <div className="text-xs text-white/35 mt-1">{device}</div>
    </div>
  );
}
