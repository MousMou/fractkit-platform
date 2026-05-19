"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  apiKey?: string;
  className?: string;
  children?: React.ReactNode;
}

export function CheckoutButton({ apiKey, className, children = "Start Pro" }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    const key = apiKey || prompt("Enter your FractKit API key to upgrade to Pro:");
    if (!key) return;

    setLoading(true);
    setError(null);

    try {
      const resp = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "https://api.fractkit.io"}/v1/billing/checkout`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: key,
            success_url: `${window.location.origin}/billing/success`,
            cancel_url: `${window.location.origin}/billing/cancel`,
          }),
        }
      );

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.detail ?? `Error ${resp.status}`);
      }

      const { checkout_url } = await resp.json();
      window.location.href = checkout_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setLoading(false);
    }
  };

  return (
    <div>
      <Button onClick={handleClick} disabled={loading} className={className}>
        {loading ? "Redirecting…" : children}
      </Button>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
