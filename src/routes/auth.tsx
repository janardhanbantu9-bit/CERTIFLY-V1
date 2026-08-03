import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/create" });
  },
  head: () => ({
    meta: [
      { title: "Admin Sign In — Certifly" },
      {
        name: "description",
        content:
          "Secure sign-in for Certifly administrators to manage and review issued certificates.",
      },
      { property: "og:title", content: "Admin Sign In — Certifly" },
      {
        property: "og:description",
        content: "Secure sign-in for Certifly administrators.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

const credentialsSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, { message: "Enter your admin username" })
    .max(64)
    .regex(/^[A-Za-z0-9_]+$/, { message: "Letters, numbers and underscores only" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }).max(128),
});

/** Admin usernames map to deterministic internal addresses. */
function usernameToEmail(username: string) {
  return `${username.trim().toLowerCase()}@certifly.local`;
}

function AuthPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsed = credentialsSchema.safeParse({ username, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid details");
      return;
    }

    setPending(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(parsed.data.username),
      password: parsed.data.password,
    });
    setPending(false);

    if (signInError) {
      setError("Those credentials didn't work. Check your username and password.");
      return;
    }

    toast.success("Signed in");
    navigate({ to: "/create", replace: true });
  }

  return (
    <main className="dark relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 text-foreground">
      <div aria-hidden className="aurora-pink" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 bg-background/15"
      />

      <section className="glass-strong relative z-10 w-full max-w-sm rounded-2xl p-8">
        <div className="glass mb-6 flex h-11 w-11 items-center justify-center rounded-xl">
          <ShieldCheck className="size-5 text-foreground" aria-hidden />
        </div>

        <h1 className="text-xl font-semibold tracking-tight text-foreground">Admin sign in</h1>
        <p className="mt-1.5 text-sm text-foreground/70">
          Certifly administration is restricted to authorised accounts.
        </p>

        <form onSubmit={onSubmit} className="mt-7 space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="username" className="text-foreground">
              Username
            </Label>
            <Input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ADMIN1"
              className="glass h-10 rounded-xl text-foreground placeholder:text-foreground/40"
              maxLength={64}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="glass h-10 rounded-xl text-foreground placeholder:text-foreground/40"
              maxLength={128}
              required
            />
          </div>

          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            size="lg"
            variant="secondary"
            className="w-full bg-foreground text-background hover:bg-foreground/90"
            disabled={pending}
          >
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
            {pending ? "Signing in" : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-xs text-foreground/60">
          Accounts are created by the Certifly team. There is no public sign-up.
        </p>
      </section>
    </main>
  );
}

