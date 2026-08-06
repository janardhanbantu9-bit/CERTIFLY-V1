import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronRight,
  FilePlus2,
  Search,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  type Filter = "all" | "active" | "drafts";

  useEffect(() => {
    fetchEventsWithCertificates()
      .then(({ events, certificates }) => {
        setEvents(events);
        setCerts(certificates);
      })
      .catch(() => {});
  }, []);
   const activeCount = events.filter((e) => e.codes.length > 0).length;
  const draftCount = events.length - activeCount;

  const newThisMonth = useMemo(() => {
    const now = new Date();
    return events.filter((e) => {
      const d = new Date(e.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }, [events]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((e) => {
      if (filter === "active" && e.codes.length === 0) return false;
      if (filter === "drafts" && e.codes.length > 0) return false;
      if (!q) return true;
      return [e.organiser.eventName, e.organiser.orgName, e.organiser.theme]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q));
    });
  }, [events, filter, query]);

  const tabs: { key: Filter; label: string }[] = [
    { key: "all", label: `All Events (${events.length})` },
    { key: "active", label: `Active (${activeCount})` },
    { key: "drafts", label: `Drafts (${draftCount})` },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 mx-auto max-w-6xl w-full px-6 py-12">
        <div className="flex items-start justify-between flex-wrap gap-4">
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
         {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:max-w-2xl">
          <div className="glass rounded-2xl p-5 flex items-start gap-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/20 text-primary">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Events</div>
              <div className="font-display text-3xl font-semibold leading-tight">{events.length}</div>
              <div className="text-xs text-emerald-400">+{newThisMonth} this month</div>
            </div>
          </div>
          <div className="glass rounded-2xl p-5 flex items-start gap-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent/20 text-accent">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Certificates Issued</div>
              <div className="font-display text-3xl font-semibold leading-tight">{certs.length}</div>
              <div className="text-xs text-accent">100% 3D Rendered</div>
            </div>
          </div>
        </div>

        {/* Filters + search */}
        <div className="mt-8 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setFilter(t.key)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm transition-colors glass",
                  filter === t.key
                    ? "border-accent/70 text-accent font-medium"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search events..."
              aria-label="Search events"
              className="w-full rounded-xl glass bg-transparent py-2.5 pl-11 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/40"
            />
          </div>
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
        ) : visible.length === 0 ? (
          <div className="mt-10 glass rounded-2xl p-8 text-center text-muted-foreground">No events match your search.</div>
        ) : (
          <div className="mt-6 grid gap-4">
            {visible.map((e) => (
              <Link
                key={e.id}
                to="/events/$eventId"
                params={{ eventId: e.id }}
                className="glass rounded-2xl overflow-hidden block w-full text-left px-6 py-5 flex items-center justify-between gap-4 flex-wrap hover:bg-white/5 transition-colors"
              >
                <div className="min-w-0">
                  <div className="text-xs font-semibold uppercase tracking-widest text-accent">{e.organiser.theme}</div>
                  <div className="font-display text-2xl font-semibold uppercase tracking-tight mt-1 truncate">
                    {e.organiser.eventName}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {e.organiser.orgName} · {e.codes.length} certificates · {new Date(e.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    Template: <span className="text-primary font-medium">{e.templateId}</span>
                  </div>
                  <span className="grid h-9 w-9 place-items-center rounded-full glass">
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>

        )}

        
      </main>
      <Footer />
    </div>
  );
}
