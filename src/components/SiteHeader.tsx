import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { Menu, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function SiteHeader({ user, isAdmin = false }: { user?: User | null; isAdmin?: boolean }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 lg:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-primary font-display text-lg font-bold text-primary-foreground">
            B
          </span>
          <span className="font-display text-xl font-semibold tracking-normal">BEGIN UPSC</span>
        </Link>

        {user ? (
          <div className="flex items-center gap-2">
            {isAdmin ? (
              <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
                <Link to="/admin">
                  <ShieldCheck className="h-4 w-4" /> Admin
                </Link>
              </Button>
            ) : null}
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/dashboard">Dashboard</Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              Sign out
            </Button>
            <Menu className="h-5 w-5 text-muted-foreground md:hidden" />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/login">Login</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/signup">Get Started</Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
