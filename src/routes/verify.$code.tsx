import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { AlertTriangle, BadgeCheck, Share2, Award } from "lucide-react";
import { Header, Footer } from "@/components/Header";
import { fetchCertificate, decodeCertPayload, type CertPayload } from "@/lib/certificates";

interface VerifyData {
  code: string;
  participantName: string;
  rank: string;
  orgName: string;
  eventName: string;
  eventDate: string;
  venue?: string;
  signatoryName?: string;
  signatoryTitle?: string;
  teamOrRoll?: string;
  description?: string;
  revoked?: boolean;
}

export const Route = createFileRoute("/verify/$code")({
  validateSearch: (s: Record<string, unknown>) => ({ d: typeof s.d === "string" ? s.d : undefined }),
  head: ({ params }) => ({
    meta: [
      { title: `Verify ${params.code} — Certifly` },
      { name: "description", content: `Public verification page for certificate ${params.code}.` },
      { property: "og:title", content: `Certifly verification — ${params.code}` },
      { property: "og:description", content: "Public tamper-evident verification of a Certifly merit certificate." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VerifyByCode,
});

function isParticipation(rank: string) {
  return /participat/i.test(rank);
}

function VerifyByCode() {
  const { code } = Route.useParams();
  const { d } = useSearch({ from: "/verify/$code" });
  const [state, setState] = useState<"loading" | "found" | "missing">("loading");
  const [data, setData] = useState<VerifyData | null>(null);
  const [qr, setQr] = useState<string>("");

  useEffect(() => {
    let active = true;
    (async () => {
      const remote = await fetchCertificate(code).catch(() => null);
      let resolved: VerifyData | null = null;

      if (remote) {
        resolved = {
          code: remote.code,
          participantName: remote.participantName,
          rank: remote.rank,
          orgName: remote.organiser.orgName,
          eventName: remote.organiser.eventName,
          eventDate: remote.organiser.eventDate,
          venue: remote.organiser.venue,
          signatoryName: remote.organiser.signatoryName,
          signatoryTitle: remote.organiser.signatoryTitle,
          teamOrRoll: remote.teamOrRoll,
          description: remote.organiser.description,
          revoked: remote.revoked,
        };
      } else if (d) {
        const payload: CertPayload | null = decodeCertPayload(d);
        if (payload && payload.c.toUpperCase() === code.toUpperCase()) {
          resolved = {
            code: payload.c,
            participantName: payload.n,
            rank: payload.r,
            orgName: payload.o,
            eventName: payload.e,
            eventDate: payload.d,
            venue: payload.v,
            signatoryName: payload.s,
            signatoryTitle: payload.st,
            teamOrRoll: payload.t,
          };
        }
      }

      if (!active) return;
      if (resolved) {
        setData(resolved);
        setState("found");
        QRCode.toDataURL(window.location.href, { width: 240, margin: 1 }).then(setQr).catch(() => {});
      } else {
        setState("missing");
      }
    })();
    return () => {
      active = false;
    };
  }, [code, d]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 mx-auto max-w-3xl w-full px-6 py-16">
        {state === "loading" && (
          <div className="glass-strong rounded-3xl p-10 text-center text-muted-foreground">Loading verification…</div>
        )}
        {state === "missing" && <MissingState code={code} />}
        {state === "found" && data && <FoundState data={data} qr={qr} />}
      </main>
      <Footer />
    </div>
  );
}

function MissingState({ code }: { code: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-strong rounded-3xl p-10 text-center"
    >
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-destructive/20 text-destructive">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h1 className="mt-6 font-display text-3xl font-semibold">Certificate not found</h1>
      <p className="mt-2 text-muted-foreground">
        The code <span className="font-mono text-foreground">{code}</span> doesn't match any certificate on record. It may be mistyped, revoked, or fake.
      </p>
      <div className="mt-6 flex justify-center gap-2">
        <Link to="/verify" className="rounded-full px-5 py-2.5 text-sm glass hover:bg-white/10">Try another code</Link>
      </div>
    </motion.div>
  );
}

function FoundState({ data, qr }: { data: VerifyData; qr: string }) {
  const accent = "#a855f7";
  const revoked = !!data.revoked;
  const participation = isParticipation(data.rank);
  const statusLabel = participation ? "Participated" : data.rank;

  return (
    <div className="space-y-6">
      <Confetti />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="glass-strong rounded-3xl p-8 md:p-10 relative overflow-hidden"
      >
        <div
          className="absolute -top-16 -right-16 h-64 w-64 rounded-full blur-3xl opacity-30"
          style={{ background: accent }}
        />
        <div className="flex items-start gap-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
            className={`grid h-14 w-14 place-items-center rounded-2xl ${revoked ? "bg-destructive/20 text-destructive" : "btn-hero text-white"}`}
          >
            {revoked ? <AlertTriangle className="h-7 w-7" /> : <BadgeCheck className="h-7 w-7" />}
          </motion.div>
          <div className="flex-1 min-w-0">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              {revoked ? "Revoked" : participation ? "Certificate of Participation" : "Verified certificate"}
            </div>
            <h1 className="mt-1 font-display text-3xl md:text-4xl font-semibold tracking-tight">
              {data.participantName}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {participation ? (
                <>
                  <span className="text-foreground font-medium">participated</span> in{" "}
                  <span className="text-foreground font-medium">{data.eventName}</span>.
                </>
              ) : (
                <>
                  was awarded <span className="text-foreground font-medium">{data.rank}</span> at{" "}
                  <span className="text-foreground font-medium">{data.eventName}</span>.
                </>
              )}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-[1fr_auto]">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Participant" value={data.participantName} />
            <Field label={participation ? "Status" : "Rank"} value={statusLabel} />
            <Field label="Event" value={data.eventName} />
            <Field label="Date" value={data.eventDate ? new Date(data.eventDate).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "—"} />
            <Field label="Organisation" value={data.orgName} />
            <Field label="Venue" value={data.venue || "—"} />
            {data.signatoryName && (
              <Field label="Signed by" value={`${data.signatoryName}${data.signatoryTitle ? ` · ${data.signatoryTitle}` : ""}`} />
            )}
            {data.teamOrRoll && <Field label="Team / Roll" value={data.teamOrRoll} />}
            <div className="col-span-2">
              <Field label="Certificate code" value={data.code} mono />
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            {qr && <img src={qr} alt="QR" className="h-32 w-32 rounded-xl bg-white p-1.5" />}
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Public verify link</div>
          </div>
        </div>

        {data.description && (
          <div className="mt-6 rounded-2xl bg-white/5 p-4 text-sm text-muted-foreground">
            {data.description}
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Award className="h-4 w-4" />
            Verified by <span className="text-foreground font-medium">Certifly</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const url = window.location.href;
                if (navigator.share) navigator.share({ title: `Certificate ${data.code}`, url }).catch(() => {});
                else navigator.clipboard.writeText(url);
              }}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm glass hover:bg-white/10"
            >
              <Share2 className="h-4 w-4" /> Share
            </button>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold btn-hero"
            >
              Post on LinkedIn
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-1 text-sm ${mono ? "font-mono" : "font-medium"}`}>{value}</div>
    </div>
  );
}

function Confetti() {
  const pieces = Array.from({ length: 40 });
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden -z-0">
      {pieces.map((_, i) => {
        const colors = ["#a855f7", "#ec4899", "#3b82f6", "#c084fc"];
        const c = colors[i % colors.length];
        const left = Math.random() * 100;
        const delay = Math.random() * 0.8;
        return (
          <motion.span
            key={i}
            initial={{ y: -50, opacity: 0, rotate: 0 }}
            animate={{ y: "110vh", opacity: [0, 1, 1, 0], rotate: 360 }}
            transition={{ duration: 3 + Math.random() * 2, delay, ease: "easeIn" }}
            style={{ left: `${left}%`, background: c }}
            className="absolute top-0 h-2 w-2 rounded-sm"
          />
        );
      })}
    </div>
  );
}
