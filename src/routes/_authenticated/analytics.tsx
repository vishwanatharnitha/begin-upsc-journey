import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { pageMeta } from "@/lib/pageMeta";
import { formatMinutes } from "@/lib/upsc";
import { DataBar } from "@/components/DataBar";
import { MetricCard } from "@/components/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/_authenticated/analytics")({ head: () => pageMeta("Analytics — BEGIN UPSC", "Preparation analytics based only on saved study sessions, topic progress and test attempts."), component: AnalyticsPage });

function AnalyticsPage() {
  const sessions = useQuery({ queryKey: ["study_sessions"], queryFn: async () => { const { data, error } = await supabase.from("study_sessions").select("minutes, studied_on, subject_id, subjects(name)").order("studied_on", { ascending: false }).limit(120); if (error) throw error; return data ?? []; }});
  const attempts = useQuery({ queryKey: ["test_attempts"], queryFn: async () => { const { data, error } = await supabase.from("test_attempts").select("accuracy, score, started_at").order("started_at", { ascending: false }).limit(20); if (error) throw error; return data ?? []; }});
  const progress = useQuery({ queryKey: ["topic_progress"], queryFn: async () => { const { data, error } = await supabase.from("topic_progress").select("status, progress_percentage"); if (error) throw error; return data ?? []; }});
  const totalMinutes = sessions.data?.reduce((sum, item) => sum + item.minutes, 0) ?? 0;
  const avgAccuracy = attempts.data?.length ? Math.round(attempts.data.reduce((sum, item) => sum + item.accuracy, 0) / attempts.data.length) : 0;
  const avgProgress = progress.data?.length ? Math.round(progress.data.reduce((sum, item) => sum + item.progress_percentage, 0) / progress.data.length) : 0;
  const subjectMinutes = new Map<string, number>();
  (sessions.data ?? []).forEach((item) => subjectMinutes.set(item.subjects?.name ?? "General study", (subjectMinutes.get(item.subjects?.name ?? "General study") ?? 0) + item.minutes));
  const maxSubject = Math.max(...Array.from(subjectMinutes.values()), 0);
  return <div className="space-y-6"><PageHeader title="Analytics" description="No selection claims or random projections. These charts use only your stored activity." /><div className="grid gap-5 md:grid-cols-3"><MetricCard label="Total logged" value={formatMinutes(totalMinutes)} /><MetricCard label="Average accuracy" value={`${avgAccuracy}%`} /><MetricCard label="Syllabus average" value={`${avgProgress}%`} /></div><div className="grid gap-6 lg:grid-cols-2"><Card className="border-border/70"><CardHeader><CardTitle>Study time by subject</CardTitle></CardHeader><CardContent className="space-y-4">{Array.from(subjectMinutes.entries()).map(([name, value]) => <DataBar key={name} label={name} value={value} max={maxSubject} detail={formatMinutes(value)} />)}{!subjectMinutes.size ? <p className="text-sm text-muted-foreground">No study sessions logged yet.</p> : null}</CardContent></Card><Card className="border-border/70"><CardHeader><CardTitle>Accuracy trend</CardTitle></CardHeader><CardContent className="space-y-4">{attempts.data?.map((attempt, index) => <DataBar key={`${attempt.started_at}-${index}`} label={new Date(attempt.started_at).toLocaleDateString()} value={attempt.accuracy} max={100} detail={`${Math.round(attempt.accuracy)}%`} />)}{!attempts.data?.length ? <p className="text-sm text-muted-foreground">No attempts saved yet.</p> : null}</CardContent></Card></div></div>;
}
