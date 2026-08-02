import type { Certificate } from "@/lib/certificates";
import type { CertTemplate } from "@/lib/templates";
import { forwardRef } from "react";

interface Props {
  cert: Certificate;
  template: CertTemplate;
  qrDataUrl?: string;
}

function isParticipation(rank: string) {
  return /participat/i.test(rank);
}

export const CertificatePreview = forwardRef<HTMLDivElement, Props>(function CertificatePreview(
  { cert, template, qrDataUrl },
  ref,
) {
  const accent = cert.accentColor || template.accent;
  const { organiser } = cert;
  const isLight = template.variant === "light";
  const textColor = template.textColor || (isLight ? "#1a1a1a" : "#ffffff");
  const mutedColor = template.mutedColor || (isLight ? "#6b6b6b" : "rgba(255,255,255,0.7)");
  const participation = isParticipation(cert.rank);

  return (
    <div
      ref={ref}
      className="relative overflow-hidden"
      style={{
        width: 1100,
        height: 780,
        background: template.bgGradient,
        color: textColor,
        fontFamily: "'Georgia', 'Cormorant Garamond', serif",
      }}
    >
      {/* pattern overlays */}
      {!isLight && (
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(600px 400px at 10% 0%, rgba(255,255,255,0.08), transparent 60%), radial-gradient(500px 400px at 100% 100%, rgba(255,255,255,0.06), transparent 60%)",
          }}
        />
      )}

      {template.pattern === "ornate" && (
        <>
          <div className="absolute inset-6 rounded-sm" style={{ border: `3px solid ${accent}` }}>
            <div className="absolute inset-2 rounded-sm" style={{ border: `1px solid ${accent}90` }} />
          </div>
        </>
      )}
      {template.pattern === "tech" && (
        <>
          <div className="absolute inset-0 opacity-40" style={{
            backgroundImage:
              `linear-gradient(${accent}22 1px, transparent 1px), linear-gradient(90deg, ${accent}22 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }} />
          <div className="absolute top-8 left-8 h-10 w-10 border-t-2 border-l-2" style={{ borderColor: accent }} />
          <div className="absolute top-8 right-8 h-10 w-10 border-t-2 border-r-2" style={{ borderColor: accent }} />
          <div className="absolute bottom-8 left-8 h-10 w-10 border-b-2 border-l-2" style={{ borderColor: accent }} />
          <div className="absolute bottom-8 right-8 h-10 w-10 border-b-2 border-r-2" style={{ borderColor: accent }} />
        </>
      )}
      {template.pattern === "modern" && (
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full blur-3xl opacity-40" style={{ background: accent }} />
      )}
      {template.pattern === "minimal" && (
        <div className="absolute left-16 top-16 bottom-16 w-[3px]" style={{ background: accent }} />
      )}

      {template.pattern === "floral" && (
        <>
          {/* Subtle paisley texture */}
          <div className="absolute inset-0 opacity-[.08]" style={{
            backgroundImage:
              `radial-gradient(circle at 20% 30%, ${accent} 1.5px, transparent 2px), radial-gradient(circle at 70% 60%, ${accent} 1px, transparent 2px)`,
            backgroundSize: "60px 60px, 90px 90px",
          }} />
          {/* thin gold double border */}
          <div className="absolute inset-8" style={{ border: `1.5px solid ${accent}` }} />
          <div className="absolute inset-12" style={{ border: `1px solid ${accent}80` }} />
          {/* floral corner top-right */}
          <FloralCorner accent={accent} position="tr" />
          <FloralCorner accent={accent} position="bl" />
        </>
      )}

      {template.pattern === "wave" && (
        <>
          {/* Top wave */}
          <svg className="absolute -top-6 -left-6 w-[130%]" viewBox="0 0 1200 220" preserveAspectRatio="none" style={{ height: 180 }}>
            <path d={`M0,80 C300,180 600,-20 900,80 C1080,140 1160,120 1200,80 L1200,0 L0,0 Z`} fill={`${accent}22`} />
            <path d={`M0,120 C300,220 600,20 900,120 C1080,180 1160,160 1200,120 L1200,0 L0,0 Z`} fill={`${accent}12`} />
          </svg>
          {/* Bottom wave */}
          <svg className="absolute -bottom-6 -left-6 w-[130%]" viewBox="0 0 1200 260" preserveAspectRatio="none" style={{ height: 220 }}>
            <path d={`M0,180 C300,80 600,280 900,180 C1080,120 1160,140 1200,180 L1200,260 L0,260 Z`} fill={`${accent}22`} />
            <path d={`M0,220 C300,120 600,320 900,220 C1080,160 1160,180 1200,220 L1200,260 L0,260 Z`} fill={accent} opacity={0.9} />
          </svg>
        </>
      )}

      {template.pattern === "geometric" && (
        <>
          <div className="absolute top-0 left-0 h-40 w-64" style={{ background: "#0e1e3a", clipPath: "polygon(0 0, 100% 0, 70% 100%, 0 100%)" }} />
          <div className="absolute bottom-0 right-0 h-40 w-64" style={{ background: "#0e1e3a", clipPath: "polygon(30% 0, 100% 0, 100% 100%, 0 100%)" }} />
          <div className="absolute top-0 right-0 h-24 w-40" style={{ background: accent, clipPath: "polygon(30% 0, 100% 0, 100% 100%, 0 100%)" }} />
          <div className="absolute bottom-0 left-0 h-24 w-40" style={{ background: accent, clipPath: "polygon(0 0, 100% 0, 70% 100%, 0 100%)" }} />
        </>
      )}

      {template.pattern === "curve" && (
        <>
          <svg className="absolute -bottom-4 -left-4 w-[110%]" viewBox="0 0 1200 260" preserveAspectRatio="none" style={{ height: 220 }}>
            <path d={`M0,240 C200,80 500,320 800,180 C960,100 1100,120 1200,140 L1200,260 L0,260 Z`} fill={`${accent}22`} />
            <path d={`M0,260 C200,120 500,340 800,220 C960,160 1100,180 1200,200 L1200,260 L0,260 Z`} fill={accent} />
          </svg>
          <div className="absolute top-8 left-0 right-0 mx-auto h-1 w-40 rounded-full" style={{ background: accent }} />
        </>
      )}

      {/* content */}
      <div className="relative h-full w-full px-24 py-20 flex flex-col">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {organiser.logoDataUrl ? (
              <img src={organiser.logoDataUrl} alt="" className="h-14 w-14 object-contain" />
            ) : (
              <div
                className="grid h-14 w-14 place-items-center rounded-full text-xl font-bold"
                style={{ background: accent, color: isLight ? "#ffffff" : "#0a0a12" }}
              >
                {organiser.orgName.slice(0, 1)}
              </div>
            )}
            <div>
              <div className="text-xs uppercase tracking-[0.3em]" style={{ color: mutedColor }}>Presented by</div>
              <div className="text-lg font-semibold tracking-wide">{organiser.orgName || "Organisation"}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-[0.3em]" style={{ color: mutedColor }}>Certificate No.</div>
            <div className="mt-1 font-mono text-sm" style={{ color: accent }}>{cert.code}</div>
          </div>
        </div>

        <div className="mt-16 flex-1">
          <div className="text-[13px] uppercase tracking-[0.4em]" style={{ color: accent }}>
            {participation ? "Certificate of Participation" : "Certificate of Merit"}
          </div>
          <div className="mt-4 text-2xl italic" style={{ color: mutedColor }}>This is to certify that</div>
          <div className="mt-6 text-[68px] leading-none font-semibold" style={{ color: accent }}>
            {cert.participantName}
          </div>
          {cert.teamOrRoll && (
            <div className="mt-2 text-sm" style={{ color: mutedColor }}>{cert.teamOrRoll}</div>
          )}
          <div className="mt-8 max-w-2xl text-xl leading-relaxed" style={{ color: isLight ? "#2a2a2a" : "rgba(255,255,255,0.9)" }}>
            {participation ? (
              <>has <span className="font-semibold" style={{ color: accent }}>participated</span> in </>
            ) : (
              <>has been awarded <span className="font-semibold" style={{ color: accent }}>{cert.rank}</span> for outstanding participation in </>
            )}
            <span className="font-semibold">{organiser.eventName}</span>
            {organiser.venue ? <> held at <span className="italic">{organiser.venue}</span></> : null}
            {organiser.eventDate ? <> on <span className="italic">{new Date(organiser.eventDate).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</span></> : null}.
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div>
            {organiser.signatureDataUrl ? (
              <img src={organiser.signatureDataUrl} alt="" className="h-14 object-contain" />
            ) : (
              <div className="h-14 w-52" style={{ borderBottom: `1px solid ${accent}` }} />
            )}
            <div className="mt-2 text-sm font-semibold">{organiser.signatoryName || "Signatory"}</div>
            <div className="text-xs" style={{ color: mutedColor }}>{organiser.signatoryTitle || "Designation"}</div>
          </div>

          <div className="flex flex-col items-center">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR" className="h-28 w-28 rounded-md bg-white p-1" />
            ) : (
              <div className="h-28 w-28 rounded-md" style={{ background: isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.1)" }} />
            )}
            <div className="mt-2 text-[10px] uppercase tracking-widest" style={{ color: mutedColor }}>Scan to verify</div>
          </div>

          <div className="text-right">
            <div className="grid h-14 w-14 place-items-center rounded-full ml-auto" style={{ background: accent }}>
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke={isLight ? "#ffffff" : "#0a0a12"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l3 6 6 .9-4.5 4.4 1 6.2L12 16.9 6.5 19.5l1-6.2L3 8.9 9 8z" />
              </svg>
            </div>
            <div className="mt-2 text-xs" style={{ color: mutedColor }}>Verified by Certifly</div>
          </div>
        </div>
      </div>
    </div>
  );
});

function FloralCorner({ accent, position }: { accent: string; position: "tr" | "bl" }) {
  const style: React.CSSProperties =
    position === "tr"
      ? { top: -20, right: -20, transform: "rotate(20deg)" }
      : { bottom: -20, left: -20, transform: "rotate(200deg)" };
  return (
    <svg viewBox="0 0 200 200" className="absolute h-56 w-56 opacity-90" style={style}>
      <g fill={accent}>
        <circle cx="100" cy="70" r="18" opacity=".75" />
        <circle cx="130" cy="90" r="14" opacity=".55" />
        <circle cx="80" cy="100" r="12" opacity=".6" />
        <circle cx="115" cy="120" r="10" opacity=".7" />
        <circle cx="95" cy="130" r="8" opacity=".5" />
        <path d="M60 140 C 80 100, 140 90, 170 40" stroke={accent} strokeWidth="2" fill="none" opacity=".5" />
        <path d="M70 150 C 100 130, 150 110, 180 70" stroke={accent} strokeWidth="1.5" fill="none" opacity=".35" />
      </g>
    </svg>
  );
}
