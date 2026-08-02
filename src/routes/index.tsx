import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Award, QrCode, Sparkles, Shield, Zap, Layers, Download, CheckCircle2, ArrowRight } from "lucide-react";
import HeroSceneMount from "@/components/HeroSceneMount";
import { Header, Footer } from "@/components/Header";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Certifly — 3D animated merit certificates with QR verification" },
      { name: "description", content: "Generate beautiful merit certificates in bulk, each with a unique QR code and verification link. Built for hackathons, sports, academic and creative events." },
      { property: "og:title", content: "Certifly — 3D animated merit certificates" },
      { property: "og:description", content: "Bulk certificate generation with unique QR + verification codes and a 3D animated interface." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <Features />
        <HowItWorks />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <HeroSceneMount />
      </div>
      <div className="mx-auto max-w-7xl px-6 pt-24 pb-32 md:pt-32 md:pb-40 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs uppercase tracking-widest text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            Verifiable · Beautiful · Bulk-ready
          </div>
          <h1 className="mt-6 font-display text-5xl md:text-7xl font-semibold leading-[1.02] tracking-tight">
            Certificates that <span className="gradient-text">move</span>,
            <br /> proof that <span className="gradient-text">holds</span>.
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl">
            Generate merit certificates for every participant in seconds. Each one carries a unique QR and code that opens a public, tamper-evident verification page.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              to="/create"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold btn-hero"
            >
              Start generating <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/verify"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold glass-strong hover:bg-white/10 transition"
            >
              <QrCode className="h-4 w-4" /> Verify a certificate
            </Link>
          </div>

          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl">
            {[
              { k: "500+", v: "Bulk in one run" },
              { k: "< 3s", v: "Per certificate" },
              { k: "SHA-256", v: "Signed codes" },
              { k: "100%", v: "Public verify" },
            ].map((s) => (
              <div key={s.k}>
                <div className="font-display text-2xl md:text-3xl font-semibold gradient-text">{s.k}</div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">{s.v}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    { icon: Layers, title: "3D template gallery", desc: "Themed designs for hackathons, sports, academics and more — each tilts and reacts to your cursor." },
    { icon: Zap, title: "Bulk in seconds", desc: "Upload a CSV or paste names. Ranks, roles and personalization all filled automatically." },
    { icon: QrCode, title: "QR + unique code", desc: "Every certificate ships with a scannable QR and a short human-readable ID for backup." },
    { icon: Shield, title: "Anti-forgery", desc: "Codes are entropy-strong and stored server-side. Tampered codes surface a clear invalid state." },
    { icon: Download, title: "Instant downloads", desc: "Grab a single PNG, or ZIP the whole batch with a master CSV of codes." },
    { icon: CheckCircle2, title: "Public verify page", desc: "Anyone can confirm authenticity — no login, no friction, mobile-friendly." },
  ];
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="max-w-2xl">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">What you get</div>
        <h2 className="mt-2 font-display text-4xl md:text-5xl font-semibold tracking-tight">
          Every certificate is a <span className="gradient-text">signed artifact</span>.
        </h2>
      </div>
      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {items.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
            className="glass rounded-2xl p-6 hover:bg-white/[.08] transition group"
          >
            <div className="grid h-11 w-11 place-items-center rounded-xl btn-hero">
              <f.icon className="h-5 w-5 text-white" />
            </div>
            <h3 className="mt-5 font-display text-xl font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", t: "Set up your event", d: "Organisation, event name, theme, signatory — all populated into the template automatically." },
    { n: "02", t: "Pick a 3D template", d: "Browse tilt-hover cards and preview your data live inside each design." },
    { n: "03", t: "Add ranks & participants", d: "Configure 1st, 2nd, 3rd, Participation or custom ranks. Paste names or import CSV." },
    { n: "04", t: "Generate & share", d: "Bulk export PNGs, download a ZIP, and share verification links with participants." },
  ];
  return (
    <section className="relative mx-auto max-w-7xl px-6 py-24">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">The flow</div>
      <h2 className="mt-2 font-display text-4xl md:text-5xl font-semibold tracking-tight max-w-2xl">
        From roster to <span className="gradient-text">verified certificate</span>, in minutes.
      </h2>
      <div className="mt-12 grid gap-4 md:grid-cols-4">
        {steps.map((s, i) => (
          <motion.div
            key={s.n}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className="glass rounded-2xl p-6"
          >
            <div className="font-display text-3xl gradient-text font-semibold">{s.n}</div>
            <div className="mt-3 font-semibold">{s.t}</div>
            <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="relative overflow-hidden rounded-3xl glass-strong p-10 md:p-16">
        <div className="absolute -top-20 -right-16 h-72 w-72 rounded-full blur-3xl opacity-40" style={{ background: "var(--gradient-brand)" }} />
        <div className="relative max-w-2xl">
          <Award className="h-8 w-8 text-white" />
          <h2 className="mt-5 font-display text-4xl md:text-5xl font-semibold tracking-tight">
            Your event, <span className="gradient-text">recognised</span>.
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Give participants something worth sharing — a certificate that carries proof of participation, and a link that never breaks.
          </p>
          <Link
            to="/create"
            className="mt-8 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold btn-hero"
          >
            Generate your first batch <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
