import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatMinutes, todayKey } from "@/lib/upsc";
import { pageMeta } from "@/lib/pageMeta";
import { DataBar } from "@/components/DataBar";
import { MetricCard } from "@/components/MetricCard";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => pageMeta("Dashboard — BEGIN UPSC", "DB-backed UPSC preparation dashboard with syllabus progress, study hours, tasks and test performance."),
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const [minutes, setMinutes] = useState("60");
  const [logSubject, setLogSubject] = useState("none");

  const subjects = useQuery({ queryKey: ["subjects-list"], queryFn: async () => {
    const { data, error } = await supabase.from("subjects").select("id, name").order("display_order");
    if (error) throw error; return data ?? [];
  }});
  const topics = useQuery({ queryKey: ["syllabus_topics"], queryFn: async () => {
    const { data, error } = await supabase.from("syllabus_topics").select("id, subject_id");
    if (error) throw error; return data ?? [];
  }});
  const progress = useQuery({ queryKey: ["topic_progress"], queryFn: async () => {
    const { data, error } = await supabase.from("topic_progress").select("topic_id, status, progress_percentage");
    if (error) throw error; return data ?? [];
  }});
  const sessions = useQuery({ queryKey: ["study_sessions"], queryFn: async () => {
    const { data, error } = await supabase.from("study_sessions").select("id, minutes, studied_on, subject_id").order("studied_on", { ascending: false }).limit(80);
    if (error) throw error; return data ?? [];
  }});
  const attempts = useQuery({ queryKey: ["test_attempts"], queryFn: async () => {
    const { data, error } = await supabase.from("test_attempts").select("id, score, accuracy, total_questions, completed_at, started_at").order("started_at", { ascending: false }).limit(10);
    if (error) throw error; return data ?? [];
  }});
  const tasks = useQuery({ queryKey: ["study_tasks"], queryFn: async () => {
    const { data, error } = await supabase.from("study_tasks").select("id, title, status, task_date, duration_minutes").order("task_date", { ascending: true }).limit(8);
    if (error) throw error; return data ?? [];
  }});
  const notes = useQuery({ queryKey: ["notes"], queryFn: async () => {
    const { data, error } = await supabase.from("notes").select("id, title, content, created_at").order("created_at", { ascending: false }).limit(5);
    if (error) throw error; return data ?? [];
  }});

  const logSession = useMutation({
    mutationFn: async () => {
      const value = Number(minutes);
      if (!Number.isFinite(value) || value <= 0) throw new Error("Enter a valid number of minutes");
      const { error } = await supabase.from("study_sessions").insert({ user_id: user.id, minutes: Math.round(value), subject_id: logSubject === "none" ? null : logSubject });
      if (error) throw error;
      await supabase.from("user_activity").insert({ user_id: user.id, activity_type: "study_session", duration: Math.round(value), metadata: { subject_id: logSubject } });
    },
    onSuccess: () => { toast.success("Study time logged"); queryClient.invalidateQueries({ queryKey: ["study_sessions"] }); },
    onError: () => toast.error("Could not log study time."),
  });

  const totalTopics = topics.data?.length ?? 0;
  const progressSum = progress.data?.reduce((sum, item) => sum + (item.progress_percentage ?? 0), 0) ?? 0;
  const syllabusPct = totalTopics ? Math.round(progressSum / totalTopics) : 0;
  const today = todayKey();
  const todayMinutes = sessions.data?.filter((s) => s.studied_on === today).reduce((sum, s) => sum + s.minutes, 0) ?? 0;
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 6);
  const weekKey = weekStart.toISOString().slice(0, 10);
  const weekMinutes = sessions.data?.filter((s) => s.studied_on >= weekKey).reduce((sum, s) => sum + s.minutes, 0) ?? 0;
  const completedTasks = tasks.data?.filter((task) => task.status === "completed").length ?? 0;
  const latestAccuracy = attempts.data?.[0]?.accuracy ?? 0;
  const firstName = (user.user_metadata?.["full_name"] as string | undefined)?.split(" ")[0];

  const subjectRows = (subjects.data ?? []).map((subject) => {
    const subjectTopics = (topics.data ?? []).filter((topic) => topic.subject_id === subject.id);
    const ids = new Set(subjectTopics.map((topic) => topic.id));
    const value = progress.data?.filter((item) => ids.has(item.topic_id)).reduce((sum, item) => sum + (item.progress_percentage ?? 0), 0) ?? 0;
    return { name: subject.name, value: subjectTopics.length ? Math.round(value / subjectTopics.length) : 0 };
  }).slice(0, 6);

  return (
    <div className="space-y-8">
      <PageHeader title={firstName ? `Welcome back, ${firstName}` : "Your preparation"} description="Every number here comes from your saved syllabus progress, attempts, tasks and study sessions." action={<Button asChild><Link to="/onboarding">Edit goals</Link></Button>} />
      <div className="grid gap-5 md:grid-cols-4">
        <MetricCard label="Syllabus progress" value={`${syllabusPct}%`} helper={`${totalTopics} topics tracked`} />
        <MetricCard label="Studied today" value={formatMinutes(todayMinutes)} helper={today} />
        <MetricCard label="Last 7 days" value={formatMinutes(weekMinutes)} helper={`${sessions.data?.length ?? 0} recent logs`} />
        <MetricCard label="Latest accuracy" value={`${Math.round(latestAccuracy)}%`} helper={`${attempts.data?.length ?? 0} attempts saved`} />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border/70"><CardHeader><CardTitle>Subject-wise progress</CardTitle></CardHeader><CardContent className="space-y-4">{subjectRows.map((row) => <DataBar key={row.name} label={row.name} value={row.value} max={100} detail={`${row.value}%`} />)}{subjectRows.length === 0 ? <p className="text-sm text-muted-foreground">No syllabus topics are available yet.</p> : null}</CardContent></Card>
        <Card className="border-border/70"><CardHeader><CardTitle>Log study time</CardTitle></CardHeader><CardContent><form className="space-y-4" onSubmit={(e) => { e.preventDefault(); logSession.mutate(); }}><div className="space-y-2"><Label htmlFor="minutes">Minutes studied</Label><Input id="minutes" type="number" min={1} value={minutes} onChange={(e) => setMinutes(e.target.value)} /></div><div className="space-y-2"><Label>Subject</Label><Select value={logSubject} onValueChange={setLogSubject}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">General study</SelectItem>{subjects.data?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div><Button type="submit" disabled={logSession.isPending}>{logSession.isPending ? "Saving…" : "Add to today"}</Button></form></CardContent></Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border/70"><CardHeader><CardTitle>Overall syllabus</CardTitle></CardHeader><CardContent className="space-y-3"><Progress value={syllabusPct} /><p className="text-sm text-muted-foreground">{progress.data?.filter((p) => p.status === "done").length ?? 0} topics completed</p><Button asChild variant="outline" size="sm"><Link to="/syllabus">Update syllabus</Link></Button></CardContent></Card>
        <Card className="border-border/70"><CardHeader><CardTitle>Upcoming tasks</CardTitle></CardHeader><CardContent className="space-y-3">{tasks.data?.slice(0, 4).map((task) => <div key={task.id} className="text-sm"><p className="font-medium">{task.title}</p><p className="text-muted-foreground">{task.task_date} · {task.status}</p></div>)}{!tasks.data?.length ? <p className="text-sm text-muted-foreground">No tasks planned.</p> : null}<p className="text-xs text-muted-foreground">{completedTasks} completed in the latest task list.</p></CardContent></Card>
        <Card className="border-border/70"><CardHeader><CardTitle>Recent notes</CardTitle></CardHeader><CardContent className="space-y-3">{notes.data?.map((note) => <div key={note.id} className="border-b border-border/70 pb-2 last:border-0"><p className="text-sm font-medium">{note.title}</p><p className="line-clamp-2 text-xs text-muted-foreground">{note.content}</p></div>)}{!notes.data?.length ? <p className="text-sm text-muted-foreground">No notes yet.</p> : null}<Button asChild variant="outline" size="sm"><Link to="/notes">Open notes</Link></Button></CardContent></Card>
      </div>
    </div>
  );
}
