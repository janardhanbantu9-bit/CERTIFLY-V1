import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { Header, Footer } from "@/components/Header";
import { fetchEventsWithCertificates, type Certificate, type EventRecord } from "@/lib/certificates";

export const Route = createFileRoute("/_authenticated/events/$eventId")({
  head: () => ({
    meta: [
      { title: "Event details — Certifly" },
      { name: "description", content: "Event information, participants and issued certificates." },
      { property: "og:title", content: "Event details — Certifly" },
      { property: "og:description", content: "Event information, participants and issued certificates." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EventDetailsPage,
});

function EventDetailsPage() {
  const { eventId } = Route.useParams();
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchEventsWithCertificates()
      .then(({ events, certificates }) => {
        if (!active) return;
        const found = events.find((e) => e.id === eventId) ?? null;
        setEvent(found);
        setCerts(found ? certificates.filter((c) => found.codes.includes(c.code)) : []);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [eventId]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 mx-auto max-w-6xl w-full px-6 py-12">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>

        {loading ? (
          <div className="mt-8 glass rounded-2xl p-8 text-muted-foreground">Loading event…</div>
        ) : !event ? (
          <div className="mt-8 glass-strong rounded-3xl p-10 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl glass">
              <CalendarDays className="h-6 w-6" />
            </div>
            <h1 className="mt-4 font-display text-2xl font-semibold">Event not found</h1>
            <p className="mt-1 text-muted-foreground">This event may have been removed.</p>
          </div>
        ) : (
          <>
            <div className="mt-6">
              <div className="text-xs font-semibold uppercase tracking-widest text-accent">
                {event.organiser.theme}
              </div>
              <h1 className="mt-1 font-display text-4xl font-semibold uppercase tracking-tight">
                {event.organiser.eventName}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {event.organiser.orgName} · {event.codes.length} certificates ·{" "}
                {new Date(event.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              <section className="glass rounded-2xl p-6">
                <h2 className="font-display text-lg font-semibold">Event information</h2>
                <dl className="mt-3 grid gap-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Venue</dt>
                    <dd>{event.organiser.venue || "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Event date</dt>
                    <dd>{event.organiser.eventDate || "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Template</dt>
                    <dd className="text-primary font-medium">{event.templateId}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Signatory</dt>
                    <dd>{event.organiser.signatoryName || "—"}</dd>
                  </div>
                </dl>
              </section>

              <section className="glass rounded-2xl p-6">
                <h2 className="font-display text-lg font-semibold">Participants &amp; certificates</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {certs.length} certificate{certs.length === 1 ? "" : "s"} issued. Search, filters
                  (Active / Revoked / All), revoke and download actions are coming here.
                </p>
              </section>

              <section className="glass rounded-2xl p-6">
                <h2 className="font-display text-lg font-semibold">Certificate status</h2>
                <p className="mt-1 text-sm text-muted-foreground">Status tracking coming soon.</p>
              </section>

              <section className="glass rounded-2xl p-6">
                <h2 className="font-display text-lg font-semibold">Analytics</h2>
                <p className="mt-1 text-sm text-muted-foreground">Event analytics coming soon.</p>
              </section>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
