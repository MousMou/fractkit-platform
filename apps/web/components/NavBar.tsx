"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    setHasKey(!!localStorage.getItem("fk_api_key"));
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      style={
        scrolled
          ? {
              background: "rgba(5,5,16,0.80)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
            }
          : {}
      }
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4 transition-all duration-300"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/" className="font-mono text-lg font-bold tracking-tight select-none">
          fract<span className="text-violet-400">kit</span>
        </Link>
        <div className="flex items-center gap-7 text-sm text-white/50">
          {["#how", "#results", "#pricing"].map((href) => (
            <a
              key={href}
              href={href}
              className="hover:text-white transition-colors duration-200 capitalize"
            >
              {href.replace("#", "")}
            </a>
          ))}
          <a
            href="https://github.com/MousMou/fractkit-platform"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors duration-200"
          >
            GitHub
          </a>
          {hasKey ? (
            <Link
              href="/dashboard"
              className="shimmer-btn inline-flex items-center justify-center px-4 h-8 rounded-lg text-xs font-semibold text-white"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/register"
              className="shimmer-btn inline-flex items-center justify-center px-4 h-8 rounded-lg text-xs font-semibold text-white"
            >
              Get API key
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
