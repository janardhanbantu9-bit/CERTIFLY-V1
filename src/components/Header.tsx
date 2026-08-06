import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Award } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

function useSessionFlag() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setSignedIn(Boolean(data.session));
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session));
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);
  return signedIn;
}

export function Header() {
  const signedIn = useSessionFlag();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 glass border-b border-white/10 transform-gpu">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="grid h-9 w-9 place-items-center rounded-xl btn-hero">
            <Award className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-display text-base font-semibold tracking-tight">Certifly</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">3D Merit Certificates</span>
          </div>
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          {signedIn ? (
            <>
              <Link to="/create" className="hover:text-foreground transition-colors">Create</Link>
              <Link to="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
            </>
          ) : null}
          <Link to="/verify" className="hover:text-foreground transition-colors">Verify</Link>
        </nav>
        {signedIn ? (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={signOut}
              className="glass rounded-full px-4 py-2 text-sm font-medium text-foreground/80 hover:text-foreground"
            >
              Sign out
            </button>
          </div>
        ) : (
          <Link to="/auth" className="rounded-full px-4 py-2 text-sm font-medium btn-hero">
            Admin sign in
          </Link>
        )}
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-white/10 mt-24">
      <div className="mx-auto max-w-7xl px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4" />
          <span>© {new Date().getFullYear()} Certifly — 3D verified certificates.</span>
        </div>
        <div className="flex gap-6">
          <Link to="/verify">Verify a certificate</Link>
          <Link to="/create">Start generating</Link>
        </div>
      </div>
    </footer>
  );
}