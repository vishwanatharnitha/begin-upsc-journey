import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BeginUPSC — Start your civil services prep with a plan" },
      {
        name: "description",
        content:
          "A calm workspace for UPSC aspirants: the full Prelims and Mains syllabus, progress tracking, revision notes and daily study hours.",
      },
      { property: "og:title", content: "BeginUPSC — Start your civil services prep with a plan" },
      {
        property: "og:description",
        content:
          "Track the full Prelims and Mains syllabus, keep revision notes and log study hours.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    title: "Full syllabus map",
    body: "Every Prelims and Mains paper broken into topics you can mark as studied, revised or pending.",
  },
  {
    title: "Revision notes",
    body: "Write short notes per subject so revision before the exam is reading, not re-learning.",
  },
  {
    title: "Study hours",
    body: "Log minutes each day and see where your time actually goes across papers.",
  },
];

function Landing() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data } = supabase.auth.onAuthStateChange((_e, session) =>
      setUser(session?.user ?? null),
    );
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen">
      <SiteHeader user={user} />

      <section className="surface-grid border-b border-border/70">
        <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Civil services preparation
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl leading-[1.05] font-semibold md:text-6xl">
            Begin the UPSC journey with a <span className="text-gradient-accent">clear plan</span>,
            not a pile of books.
          </h1>
          <p className="mt-6 max-w-xl text-base text-muted-foreground md:text-lg">
            BeginUPSC keeps your syllabus, revision notes and study hours in one place, so every day
            of preparation adds up to visible progress.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to={user ? "/dashboard" : "/auth"}>
                {user ? "Go to dashboard" : "Create your free account"}
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to={user ? "/syllabus" : "/auth"}>Browse the syllabus</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-5 md:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="border-border/70">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t border-border/70 py-8">
        <p className="mx-auto max-w-6xl px-5 text-sm text-muted-foreground">
          BeginUPSC — built for aspirants who want structure.
        </p>
      </footer>
    </div>
  );
}
