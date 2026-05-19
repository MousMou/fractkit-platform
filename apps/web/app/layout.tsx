import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FractKit — Quantum Noise Mitigation API",
  description:
    "Production-grade quantum error mitigation powered by noisebridge. Zero extra QPU shots. Validated on IBM, IQM, and Rigetti hardware.",
  keywords: ["quantum computing", "error mitigation", "noisebridge", "QPU", "quantum API"],
  openGraph: {
    title: "FractKit — Quantum Noise Mitigation API",
    description: "Zero-overhead quantum error mitigation. Validated on 6 real QPUs.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-black text-white antialiased">{children}</body>
    </html>
  );
}
