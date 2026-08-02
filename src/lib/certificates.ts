// Certificate store backed by Lovable Cloud (shared across devices).
import { supabase } from "@/integrations/supabase/client";

export interface Organiser {
  orgName: string;
  logoDataUrl?: string;
  eventName: string;
  eventDate: string;
  venue: string;
  theme: string;
  description?: string;
  signatoryName: string;
  signatoryTitle: string;
  signatureDataUrl?: string;
}

export interface Certificate {
  code: string;
  participantName: string;
  rank: string;
  teamOrRoll?: string;
  email?: string;
  templateId: string;
  accentColor: string;
  organiser: Organiser;
  issuedAt: string;
  verifyUrl: string;
  revoked?: boolean;
}

export interface EventRecord {
  id: string;
  organiser: Organiser;
  templateId: string;
  accentColor: string;
  createdAt: string;
  codes: string[];
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function generateCode(prefix = "EVT"): string {
  const year = new Date().getFullYear();
  let s = "";
  const arr = new Uint32Array(5);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
    for (let i = 0; i < 5; i++) s += ALPHABET[arr[i] % ALPHABET.length];
  } else {
    for (let i = 0; i < 5; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `${prefix}-${year}-${s}`;
}

export function buildVerifyUrl(code: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/verify/${code}`;
}

/** QR codes point straight at the public verification page. */
export function buildQRPayloadUrl(cert: Certificate): string {
  return buildVerifyUrl(cert.code);
}

type Row = {
  code: string;
  participant_name: string;
  rank: string;
  team_or_roll: string | null;
  template_id: string;
  accent_color: string;
  organiser: unknown;
  issued_at: string;
  revoked: boolean;
};

function rowToCert(r: Row): Certificate {
  return {
    code: r.code,
    participantName: r.participant_name,
    rank: r.rank,
    teamOrRoll: r.team_or_roll ?? undefined,
    templateId: r.template_id,
    accentColor: r.accent_color,
    organiser: r.organiser as Organiser,
    issuedAt: r.issued_at,
    verifyUrl: buildVerifyUrl(r.code),
    revoked: r.revoked,
  };
}

const CERT_COLUMNS =
  "code,participant_name,rank,team_or_roll,template_id,accent_color,organiser,issued_at,revoked";

/** Persist a generated batch: one event row plus its certificates. */
export async function persistBatch(input: {
  organiser: Organiser;
  templateId: string;
  accentColor: string;
  certs: Certificate[];
}): Promise<string> {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) throw new Error("You must be signed in to issue certificates.");
  const userId = userData.user.id;

  const { data: evt, error: evtErr } = await supabase
    .from("events")
    .insert({
      created_by: userId,
      organiser: input.organiser as never,
      template_id: input.templateId,
      accent_color: input.accentColor,
    })
    .select("id")
    .single();
  if (evtErr || !evt) throw new Error(evtErr?.message ?? "Could not save the event.");

  const { error: certErr } = await supabase.from("certificates").insert(
    input.certs.map((c) => ({
      code: c.code,
      event_id: evt.id,
      created_by: userId,
      participant_name: c.participantName,
      rank: c.rank,
      team_or_roll: c.teamOrRoll ?? null,
      template_id: c.templateId,
      accent_color: c.accentColor,
      organiser: c.organiser as never,
      issued_at: c.issuedAt,
    })),
  );
  if (certErr) throw new Error(certErr.message);

  const contacts = input.certs
    .filter((c) => c.email)
    .map((c) => ({ code: c.code, email: c.email as string }));
  if (contacts.length) await supabase.from("certificate_contacts").insert(contacts);

  return evt.id;
}

/** Public lookup used by the verification page — no sign-in required. */
export async function fetchCertificate(code: string): Promise<Certificate | null> {
  const { data, error } = await supabase
    .from("certificates")
    .select(CERT_COLUMNS)
    .ilike("code", code.trim())
    .maybeSingle();
  if (error || !data) return null;
  return rowToCert(data as Row);
}

export async function fetchEventsWithCertificates(): Promise<{
  events: EventRecord[];
  certificates: Certificate[];
}> {
  const [{ data: evts }, { data: certs }] = await Promise.all([
    supabase
      .from("events")
      .select("id,organiser,template_id,accent_color,created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("certificates")
      .select(`${CERT_COLUMNS},event_id`)
      .order("issued_at", { ascending: false }),
  ]);

  const certificates = (certs ?? []).map((c) => rowToCert(c as unknown as Row));
  const byEvent = new Map<string, string[]>();
  for (const c of (certs ?? []) as unknown as (Row & { event_id: string | null })[]) {
    if (!c.event_id) continue;
    const list = byEvent.get(c.event_id) ?? [];
    list.push(c.code);
    byEvent.set(c.event_id, list);
  }

  const events: EventRecord[] = (evts ?? []).map((e) => ({
    id: e.id,
    organiser: e.organiser as unknown as Organiser,
    templateId: e.template_id,
    accentColor: e.accent_color,
    createdAt: e.created_at,
    codes: byEvent.get(e.id) ?? [],
  }));

  return { events, certificates };
}

// --- Legacy QR payload decoding (older certificates embedded data in the link) ---

export interface CertPayload {
  c: string;
  n: string;
  r: string;
  o: string;
  e: string;
  d: string;
  v?: string;
  s?: string;
  st?: string;
  t?: string;
}

function fromB64Url(str: string): Uint8Array {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((str.length + 3) % 4);
  const bin = typeof atob !== "undefined" ? atob(b64) : Buffer.from(b64, "base64").toString("binary");
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function decodeCertPayload(str: string): CertPayload | null {
  try {
    const json = new TextDecoder().decode(fromB64Url(str));
    return JSON.parse(json) as CertPayload;
  } catch {
    return null;
  }
}
