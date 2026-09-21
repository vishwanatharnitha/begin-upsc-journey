import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { ArrowRight, BookOpen, Bot, CalendarCheck, FilePenLine, Library, Newspaper, ShieldCheck, Target, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import campusDream from "@/assets/begin-upsc-campus-dream.jpg";
import { pageMeta } from "@/lib/pageMeta";

export const Route = createFileRoute("/")({
  head: () => pageMeta(
    "BEGIN UPSC — UPSC preparation platform",
    "A production UPSC preparation workspace for syllabus tracking, current affairs, practice tests, Mains answer writing, planning, analytics and AI-assisted study."
  ),
  component: Landing,
});

const sections = [
  { title: "Syllabus hierarchy", body: "Exam, paper, subject, topic and subtopic progress with bookmarks and resources.", icon: BookOpen },
  { title: "Current affairs", body: "Admin-managed issue briefs with category filters and syllabus links. Demo content is labelled.", icon: Newspaper },
  { title: "MCQ practice", body: "Topic, subject and test-style practice with stored attempts and explanations.", icon: Target },
  { title: "Test analysis", body: "Scores, accuracy and attempt history come only from saved answers.", icon: TrendingUp },
  { title: "Mains writing", body: "Question bank, word count, answer history and AI-assisted feedback labels.", icon: FilePenLine },
  { title: "Study planner", body: "Daily and weekly tasks, statuses, duration goals and streaks from completed work.", icon: CalendarCheck },
  { title: "Resources", body: "Articles, PDFs, videos and official links managed through the backend.", icon: Library },
  { title: "AI assistant", body: "Concepts, summaries, MCQs, answer structure and study plans via secure server calls.", icon: Bot },
  { title: "Admin publishing", body: "Separate role-gated content controls for questions, affairs, syllabus and resources.", icon: ShieldCheck },
];

const principles = [
  "No fabricated UPSC announcements or real news",
  "No random dashboard numbers",
  "User data isolated by backend rules",
  "Admin content separate from learner notes",
];

function Landing() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader user={user} />
      <section className="relative min-h-[calc(100vh-4rem)] overflow-hidden border-b border-border/70">
        <img src={campusDream} alt="Aspirational civil services academy campus" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-primary/75" />
        <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col justify-center px-5 py-24 text-primary-foreground lg:px-6">
          <p className="max-w-max rounded-md border border-primary-foreground/25 bg-primary-foreground/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
            Structured civil services preparation
          </p>
          <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-tight md:text-7xl">
            BEGIN UPSC
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-primary-foreground/85">
            A serious preparation workspace for aspirants who need one place for syllabus progress, current affairs, practice, Mains writing, planning, resources and analytics.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link to={user ? "/dashboard" : "/signup"}>{user ? "Open dashboard" : "Start your preparation"}<ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-primary-foreground/35 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20">
              <Link to={user ? "/syllabus" : "/login"}>View syllabus tracker</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-6">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {sections.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className="border-border/70 bg-card/90">
                <CardContent className="p-6">
                  <Icon className="h-5 w-5 text-accent" />
                  <h2 className="mt-4 text-xl font-semibold">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="border-y border-border/70 bg-secondary/55">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 md:grid-cols-[0.8fr_1.2fr] lg:px-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Production principles</p>
            <h2 className="mt-3 text-3xl font-semibold">Built around real learner state, not placeholder claims.</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {principles.map((item) => (
              <div key={item} className="rounded-md border border-border/70 bg-card p-4 text-sm font-medium">{item}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            ["Learners", "Track preparation, practice questions, write Mains answers and keep revision resources."],
            ["Mentors", "Review stored activity, topic progress and test patterns without invented metrics."],
            ["Admins", "Publish or unpublish syllabus-linked content through protected admin pages."],
          ].map(([title, body]) => (
            <div key={title} className="border-l border-border pl-5">
              <h2 className="text-2xl font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border/70 py-8">
        <p className="mx-auto max-w-7xl px-5 text-sm text-muted-foreground lg:px-6">
          BEGIN UPSC — AI-assisted features are study support only and never official UPSC guidance.
        </p>
      </footer>
    </div>
  );
}
