import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import JSZip from "jszip";
import { toPng } from "html-to-image";
import { Check, ChevronRight, ChevronLeft, Upload, Trash2, Plus, Loader2, Download, Sparkles, FileArchive, FileSpreadsheet, FileText, Link as LinkIcon } from "lucide-react";
import * as XLSX from "xlsx";
import mammoth from "mammoth";
import { toast } from "sonner";
import { Header, Footer } from "@/components/Header";
import { CertificatePreview } from "@/components/CertificatePreview";
import { TEMPLATES, EVENT_THEMES, templatesForTheme, type CertTemplate } from "@/lib/templates";
import {
  buildQRPayloadUrl,
  buildVerifyUrl,
  generateCode,
  persistBatch,
  type Certificate,
  type Organiser,
} from "@/lib/certificates";

export const Route = createFileRoute("/_authenticated/create")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: data.user?.id as string,
      _role: "admin",
    });
    if (!isAdmin) throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "Create certificates — Certifly" },
      { name: "description", content: "Set up your event, pick a 3D template, add participants and generate a batch of verifiable merit certificates." },
      { property: "og:title", content: "Create certificates — Certifly" },
      { property: "og:description", content: "Multi-step wizard: event setup, template, ranks, and bulk generation with QR verification." },
    ],
  }),
  component: CreatePage,
});

type Rank = { name: string; participants: { name: string; teamOrRoll?: string; email?: string }[] };

const STEPS = ["Event", "Template", "Participants", "Generate"] as const;

function CreatePage() {
  const [step, setStep] = useState(0);
  const [organiser, setOrganiser] = useState<Organiser>({
    orgName: "",
    eventName: "",
    eventDate: "",
    venue: "",
    theme: "Hackathon",
    description: "",
    signatoryName: "",
    signatoryTitle: "",
  });
  const [templateId, setTemplateId] = useState<string>("aurora");
  const [accentColor, setAccentColor] = useState<string>("");
  const [ranks, setRanks] = useState<Rank[]>([
    { name: "1st Place", participants: [{ name: "" }] },
    { name: "Participation", participants: [{ name: "" }] },
  ]);

  const template = TEMPLATES.find((t) => t.id === templateId) ?? TEMPLATES[0];
  const effectiveAccent = accentColor || template.accent;

  const totalParticipants = ranks.reduce(
    (n, r) => n + r.participants.filter((p) => p.name.trim()).length,
    0,
  );

  const canNext =
    step === 0
      ? organiser.orgName.trim() && organiser.eventName.trim() && organiser.eventDate && organiser.signatoryName.trim()
      : step === 1
      ? !!templateId
      : step === 2
      ? totalParticipants > 0 && ranks.every((r) => r.name.trim())
      : true;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
          <StepIndicator step={step} />
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
            <div className="glass-strong rounded-3xl p-6 md:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  {step === 0 && (
                    <EventStep organiser={organiser} setOrganiser={setOrganiser} />
                  )}
                  {step === 1 && (
                    <TemplateStep
                      organiser={organiser}
                      templateId={templateId}
                      setTemplateId={setTemplateId}
                      accentColor={accentColor}
                      setAccentColor={setAccentColor}
                    />
                  )}
                  {step === 2 && <RanksStep ranks={ranks} setRanks={setRanks} />}
                  {step === 3 && (
                    <GenerateStep
                      organiser={organiser}
                      template={template}
                      accentColor={effectiveAccent}
                      ranks={ranks}
                    />
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="mt-8 flex items-center justify-between">
                <button
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  disabled={step === 0}
                  className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm glass-strong disabled:opacity-40 hover:bg-white/10 transition"
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
                {step < STEPS.length - 1 && (
                  <button
                    onClick={() => canNext && setStep((s) => s + 1)}
                    disabled={!canNext}
                    className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold btn-hero disabled:opacity-40"
                  >
                    Continue <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="lg:sticky lg:top-24 h-fit">
              <LivePreview
                organiser={organiser}
                template={template}
                accentColor={effectiveAccent}
                sampleName={ranks[0]?.participants[0]?.name || "Participant Name"}
                sampleRank={ranks[0]?.name || "1st Place"}
              />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {STEPS.map((label, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <div key={label} className="flex items-center gap-3">
            <div
              className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm transition ${
                active ? "btn-hero text-white" : done ? "glass-strong text-foreground" : "glass text-muted-foreground"
              }`}
            >
              <span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-semibold ${
                done ? "bg-white/20" : active ? "bg-white/25" : "bg-white/10"
              }`}>
                {done ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              {label}
            </div>
            {i < STEPS.length - 1 && <div className="h-px w-8 bg-white/15" />}
          </div>
        );
      })}
    </div>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">{label}</div>
      {children}
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </label>
  );
}

const inputCls =
  "w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm outline-none focus:border-white/25 focus:bg-white/10 transition placeholder:text-white/30";

function EventStep({ organiser, setOrganiser }: { organiser: Organiser; setOrganiser: (o: Organiser) => void }) {
  const upd = (k: keyof Organiser, v: string) => setOrganiser({ ...organiser, [k]: v });

  const readFile = (file: File, key: "logoDataUrl" | "signatureDataUrl") => {
    const reader = new FileReader();
    reader.onload = () => setOrganiser({ ...organiser, [key]: reader.result as string });
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold">Event details</h2>
      <p className="text-sm text-muted-foreground mt-1">These fields populate every certificate automatically.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Field label="Organisation name">
          <input className={inputCls} value={organiser.orgName} onChange={(e) => upd("orgName", e.target.value)} placeholder="Acme University" maxLength={80} />
        </Field>
        <Field label="Organisation logo">
          <UploadInput onFile={(f) => readFile(f, "logoDataUrl")} preview={organiser.logoDataUrl} />
        </Field>
        <Field label="Event name">
          <input className={inputCls} value={organiser.eventName} onChange={(e) => upd("eventName", e.target.value)} placeholder="Hack the Universe 2026" maxLength={100} />
        </Field>
        <Field label="Event theme">
          <select className={inputCls} value={organiser.theme} onChange={(e) => upd("theme", e.target.value)}>
            {EVENT_THEMES.map((t) => (
              <option key={t} value={t} className="bg-[#1a1533]">{t}</option>
            ))}
          </select>
        </Field>
        <Field label="Event date">
          <input type="date" className={inputCls} value={organiser.eventDate} onChange={(e) => upd("eventDate", e.target.value)} />
        </Field>
        <Field label="Venue">
          <input className={inputCls} value={organiser.venue} onChange={(e) => upd("venue", e.target.value)} placeholder="Main Auditorium" maxLength={100} />
        </Field>
        <Field label="Signatory name">
          <input className={inputCls} value={organiser.signatoryName} onChange={(e) => upd("signatoryName", e.target.value)} placeholder="Dr. Ada Lovelace" maxLength={80} />
        </Field>
        <Field label="Signatory designation">
          <input className={inputCls} value={organiser.signatoryTitle} onChange={(e) => upd("signatoryTitle", e.target.value)} placeholder="Dean, School of Engineering" maxLength={80} />
        </Field>
        <Field label="Signature image (optional)">
          <UploadInput onFile={(f) => readFile(f, "signatureDataUrl")} preview={organiser.signatureDataUrl} />
        </Field>
        <Field label="Event description (optional)" hint="Shown on the public verification page.">
          <textarea rows={3} className={inputCls} value={organiser.description} onChange={(e) => upd("description", e.target.value)} maxLength={500} />
        </Field>
      </div>
    </div>
  );
}

function UploadInput({ onFile, preview }: { onFile: (f: File) => void; preview?: string }) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-dashed border-white/15 bg-white/[.03] px-3 py-2.5 cursor-pointer hover:bg-white/[.06]">
      {preview ? (
        <img src={preview} alt="" className="h-10 w-10 rounded object-contain bg-white/10 p-1" />
      ) : (
        <Upload className="h-5 w-5 text-muted-foreground" />
      )}
      <span className="text-sm text-muted-foreground">{preview ? "Replace file" : "Click to upload"}</span>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
    </label>
  );
}

function TemplateStep({
  organiser,
  templateId,
  setTemplateId,
  accentColor,
  setAccentColor,
}: {
  organiser: Organiser;
  templateId: string;
  setTemplateId: (v: string) => void;
  accentColor: string;
  setAccentColor: (v: string) => void;
}) {
  const list = useMemo(() => templatesForTheme(organiser.theme || "General"), [organiser.theme]);
  return (
    <div>
      <h2 className="font-display text-2xl font-semibold">Choose a template</h2>
      <p className="text-sm text-muted-foreground mt-1">Templates suggested for <span className="text-foreground">{organiser.theme}</span>. Hover to tilt.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {list.map((t) => (
          <TiltCard key={t.id} active={templateId === t.id} onClick={() => { setTemplateId(t.id); setAccentColor(""); }}>
            <div className="text-xs uppercase tracking-widest opacity-70">{t.themes[0]}</div>
            <div className="mt-1 font-display text-xl font-semibold flex items-center gap-2">
              {t.name}
              {templateId === t.id && <span className="rounded-full text-[10px] px-2 py-0.5 btn-hero">Selected</span>}
            </div>
            <div className="text-xs text-muted-foreground mt-1">{t.description}</div>
            <MiniTemplate template={t} />
          </TiltCard>
        ))}
      </div>
      <div className="mt-6">
        <Field label="Accent color (optional)" hint="Overrides the template accent for your batch.">
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={accentColor || (TEMPLATES.find((t) => t.id === templateId)?.accent ?? "#a855f7")}
              onChange={(e) => setAccentColor(e.target.value)}
              className="h-10 w-14 rounded-lg bg-transparent border border-white/15 cursor-pointer"
            />
            <input
              className={inputCls}
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              placeholder="#a855f7"
            />
            {accentColor && (
              <button onClick={() => setAccentColor("")} className="text-xs text-muted-foreground hover:text-foreground">
                Reset
              </button>
            )}
          </div>
        </Field>
      </div>
    </div>
  );
}

function TiltCard({ children, active, onClick }: { children: React.ReactNode; active?: boolean; onClick?: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <button
      ref={ref}
      onClick={onClick}
      onMouseMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(900px) rotateX(${(-py * 8).toFixed(2)}deg) rotateY(${(px * 10).toFixed(2)}deg) translateY(-2px)`;
      }}
      onMouseLeave={() => { if (ref.current) ref.current.style.transform = ""; }}
      className={`text-left rounded-2xl p-5 transition-all will-change-transform ${
        active ? "glass-strong ring-2 ring-white/30 glow-purple" : "glass hover:bg-white/[.08]"
      }`}
      style={{ transformStyle: "preserve-3d" }}
    >
      {children}
    </button>
  );
}

function MiniTemplate({ template }: { template: CertTemplate }) {
  return (
    <div
      className="mt-4 aspect-[1.4/1] w-full rounded-xl overflow-hidden relative border border-white/10"
      style={{ background: template.bgGradient }}
    >
      <div className="absolute inset-3 border rounded" style={{ borderColor: `${template.accent}88` }} />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-white/90">
        <div className="text-[8px] uppercase tracking-[0.4em]" style={{ color: template.accent }}>
          Certificate of Merit
        </div>
        <div className="font-serif text-lg" style={{ color: template.accent }}>{template.name}</div>
        <div className="mt-1 h-1 w-16 rounded" style={{ background: template.accent }} />
      </div>
    </div>
  );
}

function RanksStep({ ranks, setRanks }: { ranks: Rank[]; setRanks: (r: Rank[]) => void }) {
  const addRank = () => setRanks([...ranks, { name: "New Rank", participants: [{ name: "" }] }]);
  const removeRank = (i: number) => setRanks(ranks.filter((_, idx) => idx !== i));
  const updateRank = (i: number, r: Rank) => setRanks(ranks.map((x, idx) => (idx === i ? r : x)));

  const importCsv = (i: number, text: string) => {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const start = /name/i.test(lines[0] || "") ? 1 : 0;
    const parts = lines.slice(start).map((line) => {
      const cols = line.split(",").map((c) => c.trim());
      return { name: cols[0] || "", teamOrRoll: cols[1] || undefined, email: cols[2] || undefined };
    }).filter((p) => p.name);
    updateRank(i, { ...ranks[i], participants: parts.length ? parts : [{ name: "" }] });
  };

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold">Ranks & participants</h2>
      <p className="text-sm text-muted-foreground mt-1">Add ranks and their participants. CSV format: <code className="text-foreground">name,team/roll,email</code>. Or bulk-import from Excel, Word or a Google Sheet.</p>

      <BulkImportPanel onImport={(rows) => applyBulkImport(rows, ranks, setRanks)} />

      <div className="mt-6 space-y-5">
        {ranks.map((r, i) => (
          <div key={i} className="glass rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <input
                className={inputCls + " flex-1"}
                value={r.name}
                onChange={(e) => updateRank(i, { ...r, name: e.target.value })}
                placeholder="Rank name (e.g. 1st Place, Participation)"
                maxLength={60}
              />
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {r.participants.filter((p) => p.name.trim()).length} participants
              </span>
              {ranks.length > 1 && (
                <button onClick={() => removeRank(i)} className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="mt-4 space-y-2 max-h-64 overflow-auto pr-1">
              {r.participants.map((p, pi) => (
                <div key={pi} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
                  <input
                    className={inputCls}
                    value={p.name}
                    onChange={(e) => {
                      const arr = [...r.participants];
                      arr[pi] = { ...p, name: e.target.value };
                      updateRank(i, { ...r, participants: arr });
                    }}
                    placeholder="Full name"
                    maxLength={80}
                  />
                  <input
                    className={inputCls}
                    value={p.teamOrRoll ?? ""}
                    onChange={(e) => {
                      const arr = [...r.participants];
                      arr[pi] = { ...p, teamOrRoll: e.target.value };
                      updateRank(i, { ...r, participants: arr });
                    }}
                    placeholder="Team / Roll no. (optional)"
                    maxLength={60}
                  />
                  <input
                    className={inputCls}
                    value={p.email ?? ""}
                    onChange={(e) => {
                      const arr = [...r.participants];
                      arr[pi] = { ...p, email: e.target.value };
                      updateRank(i, { ...r, participants: arr });
                    }}
                    placeholder="Email (optional)"
                    maxLength={120}
                  />
                  <button
                    onClick={() => {
                      const arr = r.participants.filter((_, x) => x !== pi);
                      updateRank(i, { ...r, participants: arr.length ? arr : [{ name: "" }] });
                    }}
                    className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                onClick={() => updateRank(i, { ...r, participants: [...r.participants, { name: "" }] })}
                className="inline-flex items-center gap-1.5 text-xs rounded-full px-3 py-1.5 glass hover:bg-white/10"
              >
                <Plus className="h-3 w-3" /> Add participant
              </button>
              <label className="inline-flex items-center gap-1.5 text-xs rounded-full px-3 py-1.5 glass hover:bg-white/10 cursor-pointer">
                <Upload className="h-3 w-3" /> Import CSV
                <input
                  type="file"
                  accept=".csv,text/csv,text/plain"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const reader = new FileReader();
                    reader.onload = () => importCsv(i, String(reader.result || ""));
                    reader.readAsText(f);
                  }}
                />
              </label>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={addRank}
        className="mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm glass-strong hover:bg-white/10"
      >
        <Plus className="h-4 w-4" /> Add another rank
      </button>
    </div>
  );
}

function LivePreview({
  organiser,
  template,
  accentColor,
  sampleName,
  sampleRank,
}: {
  organiser: Organiser;
  template: CertTemplate;
  accentColor: string;
  sampleName: string;
  sampleRank: string;
}) {
  const sample: Certificate = {
    code: "EVT-2026-PRVW1",
    participantName: sampleName,
    rank: sampleRank,
    templateId: template.id,
    accentColor,
    organiser,
    issuedAt: new Date().toISOString(),
    verifyUrl: "",
  };
  return (
    <div className="glass-strong rounded-3xl p-4">
      <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3 px-2">Live preview</div>
      <div className="relative w-full aspect-[1100/780] overflow-hidden rounded-2xl bg-black/40">
        <div className="absolute inset-0 origin-top-left" style={{ transform: "scale(var(--s))", ["--s" as string]: "clamp(0.28, 100%, 1)" }}>
          <div style={{ transformOrigin: "top left" }}>
            <ScaledCert>
              <CertificatePreview cert={sample} template={template} />
            </ScaledCert>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScaledCert({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      style={{
        transform: "scale(var(--scale, 0.5))",
        transformOrigin: "top left",
        width: 1100,
        height: 780,
      }}
      className="[--scale:0.32] sm:[--scale:0.4] md:[--scale:0.45] lg:[--scale:0.42] xl:[--scale:0.5]"
    >
      {children}
    </div>
  );
}

function GenerateStep({
  organiser,
  template,
  accentColor,
  ranks,
}: {
  organiser: Organiser;
  template: CertTemplate;
  accentColor: string;
  ranks: Rank[];
}) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "generating" | "done">("idle");
  const [certs, setCerts] = useState<Certificate[]>([]);
  const stageRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const allParticipants = ranks.flatMap((r) =>
    r.participants
      .filter((p) => p.name.trim())
      .map((p) => ({ ...p, rank: r.name })),
  );

  const start = async () => {
    setStatus("generating");
    setProgress(0);
    setCerts([]);
    const built: Certificate[] = [];
    for (let i = 0; i < allParticipants.length; i++) {
      const p = allParticipants[i];
      const code = generateCode("EVT");
      const verifyUrl = buildVerifyUrl(code);
      built.push({
        code,
        participantName: p.name.trim(),
        rank: p.rank,
        teamOrRoll: p.teamOrRoll?.trim() || undefined,
        email: p.email?.trim() || undefined,
        templateId: template.id,
        accentColor,
        organiser,
        issuedAt: new Date().toISOString(),
        verifyUrl,
      });
      setProgress(Math.round(((i + 1) / allParticipants.length) * 100));
      // yield to UI
      await new Promise((r) => setTimeout(r, 12));
    }
    try {
      await persistBatch({ organiser, templateId: template.id, accentColor, certs: built });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save certificates.");
      setStatus("idle");
      return;
    }
    setCerts(built);
    setStatus("done");
  };

  const renderCertToPng = async (cert: Certificate): Promise<string> => {
    // Render offscreen
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "-99999px";
    container.style.top = "0";
    document.body.appendChild(container);
    const qr = await QRCode.toDataURL(buildQRPayloadUrl(cert), { width: 400, margin: 1, color: { dark: "#000000", light: "#ffffff" } });
    const root = document.createElement("div");
    container.appendChild(root);
    const { createRoot } = await import("react-dom/client");
    const r = createRoot(root);
    await new Promise<void>((resolve) => {
      r.render(<CertificatePreview cert={cert} template={template} qrDataUrl={qr} />);
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
    // brief settle
    await new Promise((rs) => setTimeout(rs, 50));
    const target = root.firstElementChild as HTMLElement;
    const dataUrl = await toPng(target, { pixelRatio: 2, cacheBust: true, backgroundColor: "#0a0a12" });
    r.unmount();
    container.remove();
    return dataUrl;
  };

  const downloadOne = async (cert: Certificate) => {
    const url = await renderCertToPng(cert);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${cert.code}.png`;
    a.click();
  };

  const downloadZip = async () => {
    const zip = new JSZip();
    setStatus("generating");
    setProgress(0);
    for (let i = 0; i < certs.length; i++) {
      const url = await renderCertToPng(certs[i]);
      zip.file(`${certs[i].code}.png`, url.split(",")[1], { base64: true });
      setProgress(Math.round(((i + 1) / certs.length) * 100));
    }
    const csv =
      "code,participant,rank,team_or_roll,email,verify_url\n" +
      certs
        .map((c) => [c.code, c.participantName, c.rank, c.teamOrRoll ?? "", c.email ?? "", c.verifyUrl].map((x) => `"${String(x).replace(/"/g, '""')}"`).join(","))
        .join("\n");
    zip.file("master-list.csv", csv);
    const blob = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${organiser.eventName || "certificates"}.zip`;
    a.click();
    setStatus("done");
  };

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold">Generate certificates</h2>
      <p className="text-sm text-muted-foreground mt-1">
        {allParticipants.length} certificates ready to be created for <span className="text-foreground">{organiser.eventName}</span>.
      </p>

      {status === "idle" && (
        <div className="mt-8 flex flex-col items-start gap-4">
          <div className="glass rounded-2xl p-5 w-full">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Summary</div>
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <SummaryStat label="Event" value={organiser.eventName || "—"} />
              <SummaryStat label="Template" value={template.name} />
              <SummaryStat label="Ranks" value={String(ranks.length)} />
              <SummaryStat label="Participants" value={String(allParticipants.length)} />
            </div>
          </div>
          <button onClick={start} className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold btn-hero">
            <Sparkles className="h-4 w-4" /> Start generation
          </button>
        </div>
      )}

      {status === "generating" && (
        <div ref={stageRef} className="mt-8">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin" />
              <div className="text-sm">Rendering certificates… {progress}%</div>
            </div>
            <div className="mt-4 h-2 w-full rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full btn-hero"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: "easeOut" }}
              />
            </div>
            <div className="mt-8 relative h-40">
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 mx-auto rounded-lg glass-strong"
                  initial={{ y: 60, opacity: 0, rotate: 0 }}
                  animate={{ y: -i * 10, opacity: 1, rotate: (i - 1.5) * 4 }}
                  transition={{ delay: i * 0.1, repeat: Infinity, repeatType: "reverse", duration: 1.4 }}
                  style={{ width: 220, height: 140 }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {status === "done" && certs.length > 0 && (
        <div className="mt-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-strong rounded-2xl p-6 flex flex-col md:flex-row md:items-center gap-4 justify-between"
          >
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Success</div>
              <div className="font-display text-2xl font-semibold mt-1">
                {certs.length} certificates generated
              </div>
              <div className="text-sm text-muted-foreground">Each carries a unique QR + verification code.</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={downloadZip} className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold btn-hero">
                <FileArchive className="h-4 w-4" /> Download ZIP + CSV
              </button>
              <button onClick={() => navigate({ to: "/dashboard" })} className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm glass-strong hover:bg-white/10">
                Open dashboard
              </button>
            </div>
          </motion.div>

          <div className="mt-6 grid gap-3">
            {certs.slice(0, 40).map((c) => (
              <div key={c.code} className="glass rounded-xl p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-medium truncate">{c.participantName}</div>
                  <div className="text-xs text-muted-foreground">{c.rank} · <span className="font-mono">{c.code}</span></div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`/verify/${c.code}`}
                    className="text-xs rounded-full px-3 py-1.5 glass hover:bg-white/10"
                  >
                    Verify
                  </a>
                  <button
                    onClick={() => downloadOne(c)}
                    className="inline-flex items-center gap-1.5 text-xs rounded-full px-3 py-1.5 btn-hero font-semibold"
                  >
                    <Download className="h-3.5 w-3.5" /> PNG
                  </button>
                </div>
              </div>
            ))}
            {certs.length > 40 && (
              <div className="text-sm text-muted-foreground text-center py-4">
                +{certs.length - 40} more — use "Download ZIP" for the full batch.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium truncate">{value}</div>
    </div>
  );
}

// ---------- Bulk import (Excel / Word / Google Sheets) ----------

type ImportRow = { name: string; teamOrRoll?: string; email?: string; rank?: string };

function applyBulkImport(rows: ImportRow[], ranks: Rank[], setRanks: (r: Rank[]) => void) {
  if (!rows.length) return;
  const hasRankInFile = rows.some((r) => r.rank && r.rank.trim());
  if (hasRankInFile) {
    const grouped = new Map<string, ImportRow[]>();
    for (const r of rows) {
      const key = (r.rank || "Participation").trim();
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(r);
    }
    const next: Rank[] = Array.from(grouped.entries()).map(([name, items]) => ({
      name,
      participants: items.map((it) => ({ name: it.name, teamOrRoll: it.teamOrRoll, email: it.email })),
    }));
    setRanks(next);
  } else {
    // Put everything in a single Participation rank
    setRanks([
      {
        name: "Participation",
        participants: rows.map((r) => ({ name: r.name, teamOrRoll: r.teamOrRoll, email: r.email })),
      },
    ]);
  }
}

function normalizeHeaders(row: Record<string, unknown>): ImportRow | null {
  const map: Record<string, string> = {};
  for (const k of Object.keys(row)) {
    map[k.toLowerCase().trim()] = String(row[k] ?? "").trim();
  }
  const name = map["name"] || map["participant"] || map["full name"] || map["fullname"] || map["participant name"] || "";
  if (!name) return null;
  return {
    name,
    teamOrRoll: map["team"] || map["roll"] || map["team/roll"] || map["team_or_roll"] || map["roll no"] || map["team or roll"] || undefined,
    email: map["email"] || map["e-mail"] || undefined,
    rank: map["rank"] || map["category"] || map["award"] || undefined,
  };
}

function rowsFromSheet(sheet: XLSX.WorkSheet): ImportRow[] {
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  const out: ImportRow[] = [];
  for (const r of json) {
    const norm = normalizeHeaders(r);
    if (norm) out.push(norm);
  }
  if (out.length) return out;
  // Fallback: headerless — first column is name
  const aoa = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "" });
  return aoa
    .map((r) => ({ name: String(r[0] ?? "").trim(), teamOrRoll: r[1] ? String(r[1]).trim() : undefined, email: r[2] ? String(r[2]).trim() : undefined }))
    .filter((p) => p.name && !/^name$/i.test(p.name));
}

function rowsFromDocxText(text: string): ImportRow[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !/^name$/i.test(l))
    .map((line) => {
      // Split on tab, comma, or 2+ spaces
      const cols = line.split(/\t|,| {2,}/).map((c) => c.trim()).filter(Boolean);
      return { name: cols[0], teamOrRoll: cols[1] || undefined, email: cols[2] || undefined };
    })
    .filter((p) => p.name);
}

function googleSheetToCsvUrl(input: string): string | null {
  const m = input.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!m) return null;
  const id = m[1];
  const gidMatch = input.match(/[?&#]gid=(\d+)/);
  const gid = gidMatch ? gidMatch[1] : "0";
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
}

function csvToRows(csv: string): ImportRow[] {
  const wb = XLSX.read(csv, { type: "string" });
  return rowsFromSheet(wb.Sheets[wb.SheetNames[0]]);
}

function BulkImportPanel({ onImport }: { onImport: (rows: ImportRow[]) => void }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [sheetUrl, setSheetUrl] = useState("");

  const handleFile = async (f: File) => {
    setBusy(true);
    setMsg("");
    try {
      const lower = f.name.toLowerCase();
      let rows: ImportRow[] = [];
      if (lower.endsWith(".docx")) {
        const buf = await f.arrayBuffer();
        const { value } = await mammoth.extractRawText({ arrayBuffer: buf });
        rows = rowsFromDocxText(value);
      } else if (lower.endsWith(".csv") || f.type === "text/csv") {
        const text = await f.text();
        rows = csvToRows(text);
      } else {
        const buf = await f.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        rows = rowsFromSheet(wb.Sheets[wb.SheetNames[0]]);
      }
      if (!rows.length) {
        setMsg("No participants found. Expected a 'name' column (optional: rank, team/roll, email).");
      } else {
        setMsg(`Imported ${rows.length} participants.`);
        onImport(rows);
      }
    } catch (err) {
      setMsg("Couldn't read that file. Try .xlsx, .csv, or .docx.");
    } finally {
      setBusy(false);
    }
  };

  const handleSheet = async () => {
    if (!sheetUrl.trim()) return;
    setBusy(true);
    setMsg("");
    try {
      const csvUrl = googleSheetToCsvUrl(sheetUrl.trim());
      if (!csvUrl) {
        setMsg("That doesn't look like a Google Sheets URL.");
        return;
      }
      const res = await fetch(csvUrl);
      if (!res.ok) {
        setMsg("Couldn't fetch that sheet. Make sure it's shared as 'Anyone with the link'.");
        return;
      }
      const text = await res.text();
      const rows = csvToRows(text);
      if (!rows.length) setMsg("The sheet has no recognisable participants.");
      else {
        setMsg(`Imported ${rows.length} participants from Google Sheets.`);
        onImport(rows);
      }
    } catch {
      setMsg("Couldn't fetch that sheet. Make sure link sharing is enabled.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-5 glass-strong rounded-2xl p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <div className="text-sm font-semibold">Bulk import participants</div>
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        Upload an Excel/CSV/Word file or paste a Google Sheets URL. Columns understood: <code className="text-foreground">name</code>, <code className="text-foreground">rank</code> (optional), <code className="text-foreground">team/roll</code>, <code className="text-foreground">email</code>. When a <em>rank</em> column exists, participants are auto-grouped.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr] items-stretch">
        <label className="flex items-center gap-3 rounded-xl border border-dashed border-white/15 bg-white/[.03] px-4 py-3 cursor-pointer hover:bg-white/[.06]">
          <div className="grid h-10 w-10 place-items-center rounded-lg btn-hero text-white">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium">Upload Excel / CSV / Word</div>
            <div className="text-xs text-muted-foreground">.xlsx, .xls, .csv, .docx — up to 5,000 rows</div>
          </div>
          <input
            type="file"
            accept=".xlsx,.xls,.csv,.docx,text/csv,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.currentTarget.value = "";
            }}
          />
        </label>

        <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[.03] p-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <LinkIcon className="h-4 w-4" /> Google Sheets URL
          </div>
          <div className="flex gap-2">
            <input
              className={inputCls}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
            />
            <button
              onClick={handleSheet}
              disabled={busy || !sheetUrl.trim()}
              className="rounded-full px-4 py-2 text-sm font-semibold btn-hero disabled:opacity-40 whitespace-nowrap"
            >
              Import
            </button>
          </div>
          <div className="text-xs text-muted-foreground">Share the sheet as “Anyone with the link — Viewer”.</div>
        </div>
      </div>
      {busy && (
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" /> Reading file…
        </div>
      )}
      {msg && !busy && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          <FileText className="h-3 w-3" /> {msg}
        </div>
      )}
    </div>
  );
}

