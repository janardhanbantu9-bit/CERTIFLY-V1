import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { QrCode, Search } from "lucide-react";
import { useState } from "react";
import { Header, Footer } from "@/components/Header";

export const Route = createFileRoute("/verify/")({
  head: () => ({
    meta: [
      { title: "Verify a certificate — Certifly" },
      { name: "description", content: "Enter a certificate code to verify its authenticity and view participation details." },
      { property: "og:title", content: "Verify a certificate — Certifly" },
      { property: "og:description", content: "Public verification of Certifly merit certificates by code." },
    ],
  }),
  component: VerifyEntry,
});

function VerifyEntry() {
  const [code, setCode] = useState("");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 mx-auto max-w-2xl w-full px-6 py-24">
        <div className="glass-strong rounded-3xl p-8 md:p-12">
          <div className="grid h-12 w-12 place-items-center rounded-2xl btn-hero">
            <QrCode className="h-6 w-6 text-white" />
          </div>
          <h1 className="mt-6 font-display text-3xl md:text-4xl font-semibold tracking-tight">
            Verify a certificate
          </h1>
          <p className="mt-2 text-muted-foreground">
            Enter the code printed on the certificate (for example, <span className="font-mono text-foreground">EVT-2026-XJ4K9</span>).
          </p>
          <form
            className="mt-8 flex flex-col sm:flex-row gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (code.trim()) navigate({ to: "/verify/$code", params: { code: code.trim() } });
            }}
          >
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="EVT-2026-XXXXX"
              className="flex-1 rounded-full bg-white/5 border border-white/10 px-5 py-3 font-mono uppercase tracking-widest text-sm outline-none focus:border-white/25 focus:bg-white/10 transition"
              maxLength={40}
            />
            <button className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold btn-hero">
              <Search className="h-4 w-4" /> Verify
            </button>
          </form>

          <div className="mt-8 text-sm text-muted-foreground">
            Or scan the QR code on the certificate with your phone camera. No login required.
          </div>
        </div>

      </main>
      <Footer />
    </div>
  );
}
