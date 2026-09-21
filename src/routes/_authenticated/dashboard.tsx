import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — BeginUPSC" },
      {
        name: "description",
        content: "See your syllabus progress, study hours this week and recent notes.",
      },
      { property: "og:title", content: "Dashboard — BeginUPSC" },
      {
        property: "og:description",
        content: "See your syllabus progress, study hours this week and recent notes.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const [minutes, setMinutes] = useState("60");
  const [logSubject, setLogSubject] = useState("none");

  const subjects = useQuery({
    queryKey: ["subjects-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("id, name")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const topicCount = useQuery({
    queryKey: ["topic-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("topics")
        .select("id", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  const progress = useQuery({
    queryKey: ["topic_progress"],
    queryFn: async () => {
      const { data, error } = await supabase.from("topic_progress").select("topic_id, status");
      if (error) throw error;
      return data;
    },
  });

  const sessions = useQuery({
    queryKey: ["study_sessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_sessions")
        .select("id, minutes, studied_on, subject_id")
        .order("studied_on", { ascending: false })
        .limit(60);
      if (error) throw error;
      return data;
    },
  });

  const notes = useQuery({
    queryKey: ["notes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notes")
        .select("id, title, content, subject_id, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const logSession = useMutation({
    mutationFn: async () => {
      const value = Number(minutes);
      if (!Number.isFinite(value) || value <= 0) throw new Error("Enter a valid number of minutes");
      const { error } = await supabase.from("study_sessions").insert({
        user_id: user.id,
        minutes: Math.round(value),
        subject_id: logSubject === "none" ? null : logSubject,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Study time logged");
      queryClient.invalidateQueries({ queryKey: ["study_sessions"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not log study time"),
  });

  const total = topicCount.data ?? 0;
  const done = progress.data?.filter((p) => p.status === "done").length ?? 0;
  const touched = progress.data?.filter((p) => p.status !== "not_started").length ?? 0;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  const weekKey = weekStart.toISOString().slice(0, 10);
  const weekMinutes =
    sessions.data?.filter((s) => s.studied_on >= weekKey).reduce((a, s) => a + s.minutes, 0) ?? 0;
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayMinutes =
    sessions.data?.filter((s) => s.studied_on === todayKey).reduce((a, s) => a + s.minutes, 0) ?? 0;

  const firstName = (user.user_metadata?.full_name as string | undefined)?.split(" ")[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">
          {firstName ? `Welcome back, ${firstName}` : "Your preparation"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          A quick view of where your syllabus and study hours stand.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <Card className="border-border/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Syllabus confidence
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-3xl font-semibold">{pct}%</p>
            <Progress value={pct} />
            <p className="text-xs text-muted-foreground">
              {done} of {total} topics marked confident · {touched} started
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Studied today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {Math.floor(todayMinutes / 60)}h {todayMinutes % 60}m
            </p>
            <p className="mt-2 text-xs text-muted-foreground">Logged for {todayKey}</p>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Last 7 days</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {Math.floor(weekMinutes / 60)}h {weekMinutes % 60}m
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {notes.data?.length ?? 0} revision notes saved
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-lg">Log study time</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                logSession.mutate();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="minutes">Minutes studied</Label>
                <Input
                  id="minutes"
                  type="number"
                  min={1}
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="log-subject">Subject</Label>
                <Select value={logSubject} onValueChange={setLogSubject}>
                  <SelectTrigger id="log-subject">
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">General study</SelectItem>
                    {subjects.data?.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={logSession.isPending}>
                {logSession.isPending ? "Saving…" : "Add to today"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-lg">Recent notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {notes.data?.slice(0, 5).map((note) => (
              <div key={note.id} className="border-b border-border/70 pb-3 last:border-0 last:pb-0">
                <p className="text-sm font-medium">{note.title}</p>
                <p className="line-clamp-2 text-xs text-muted-foreground">{note.content}</p>
              </div>
            ))}
            {notes.data?.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No notes yet — start with one note per topic you revise.
              </p>
            )}
            <div className="flex gap-2 pt-2">
              <Button asChild variant="outline" size="sm">
                <Link to="/notes">Open notes</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/syllabus">Update syllabus</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
