import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarDays, ChevronRight, FilePlus2 } from "lucide-react";
import { Header, Footer } from "@/components/Header";
import { fetchEventsWithCertificates, type Certificate, type EventRecord } from "@/lib/certificates";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Certifly" },
      { name: "description", content: "Browse past events and generated certificates in your Certifly workspace." },
      { property: "og:title", content: "Dashboard — Certifly" },
      { property: "og:description", content: "Manage past events and re-download certificates." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [certs, setCerts] = useState<Certificate[]>([]);

  useEffect(() => {
    fetchEventsWithCertificates()
      .then(({ events, certificates }) => {
        setEvents(events);
        setCerts(certificates);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 mx-auto max-w-6xl w-full px-6 py-12">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Your workspace</div>
            <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight">Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {events.length} event{events.length === 1 ? "" : "s"} · {certs.length} certificate{certs.length === 1 ? "" : "s"} issued
            </p>
          </div>
          <Link to="/create" className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold btn-hero">
            <FilePlus2 className="h-4 w-4" /> New event
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="mt-12 glass-strong rounded-3xl p-10 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl glass">
              <CalendarDays className="h-6 w-6" />
            </div>
            <h2 className="mt-4 font-display text-2xl font-semibold">No events yet</h2>
            <p className="mt-1 text-muted-foreground">Create your first event to see it here.</p>
            <Link to="/create" className="mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold btn-hero">
              Get started
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-4">
            {events.map((e) => {
              const eventCerts = certs.filter((c) => e.codes.includes(c.code));
              return (
                <div key={e.id} className="glass-strong rounded-2xl p-5">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <div className="text-xs uppercase tracking-widest text-muted-foreground">{e.organiser.theme}</div>
                      <div className="font-display text-xl font-semibold mt-1">{e.organiser.eventName}</div>
                      <div className="text-sm text-muted-foreground">
                        {e.organiser.orgName} · {e.codes.length} certificates · {new Date(e.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">Template: <span className="text-foreground">{e.templateId}</span></div>
                  </div>
                  <div className="mt-4 grid gap-2 md:grid-cols-2">
                    {eventCerts.slice(0, 6).map((c) => (
                      <Link
                        key={c.code}
                        to="/verify/$code"
                        params={{ code: c.code }}
                        className="flex items-center justify-between gap-3 rounded-xl glass px-4 py-2.5 hover:bg-white/10 transition group"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{c.participantName}</div>
                          <div className="text-xs text-muted-foreground">{c.rank} · <span className="font-mono">{c.code}</span></div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                      </Link>
                    ))}
                  </div>
                  {eventCerts.length > 6 && (
                    <div className="mt-2 text-xs text-muted-foreground">+ {eventCerts.length - 6} more</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
