import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { STATUSES, statusClasses, statusLabel, statusPercent, type StatusValue } from "@/lib/upsc";
import { pageMeta } from "@/lib/pageMeta";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/syllabus")({
  head: () => pageMeta("Syllabus tracker — BEGIN UPSC", "Track hierarchical UPSC syllabus topics, subtopics and personal completion status."),
  component: SyllabusPage,
});

type Subject = { id: string; name: string; stage: string; paper: string | null; description: string | null };
type Topic = { id: string; subject_id: string; parent_id: string | null; title: string; description: string | null; display_order: number };

function SyllabusPage() {
  const queryClient = useQueryClient();
  const { user } = Route.useRouteContext();
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState("all");

  const subjects = useQuery({ queryKey: ["subjects"], queryFn: async () => {
    const { data, error } = await supabase.from("subjects").select("id, name, stage, paper, description").order("display_order");
    if (error) throw error; return (data ?? []) as Subject[];
  }});
  const topics = useQuery({ queryKey: ["syllabus_topics"], queryFn: async () => {
    const { data, error } = await supabase.from("syllabus_topics").select("id, subject_id, parent_id, title, description, display_order").order("display_order");
    if (error) throw error; return (data ?? []) as Topic[];
  }});
  const progress = useQuery({ queryKey: ["topic_progress"], queryFn: async () => {
    const { data, error } = await supabase.from("topic_progress").select("topic_id, status, progress_percentage");
    if (error) throw error; return data ?? [];
  }});

  const setStatus = useMutation({
    mutationFn: async ({ topicId, status }: { topicId: string; status: StatusValue }) => {
      const { error } = await supabase.from("topic_progress").upsert({ user_id: user.id, topic_id: topicId, status, progress_percentage: statusPercent(status), completed_at: status === "done" ? new Date().toISOString() : null }, { onConflict: "user_id,topic_id" });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["topic_progress"] }),
    onError: () => toast.error("Could not save that topic. Please try again."),
  });

  const statusFor = (topicId: string) => progress.data?.find((p) => p.topic_id === topicId)?.status ?? "not_started";
  const stages = Array.from(new Set((subjects.data ?? []).map((s) => s.stage)));
  const filteredSubjects = (subjects.data ?? []).filter((subject) => stage === "all" || subject.stage === stage);
  const filteredTopics = useMemo(() => {
    const term = query.trim().toLowerCase();
    return (topics.data ?? []).filter((topic) => !term || topic.title.toLowerCase().includes(term) || topic.description?.toLowerCase().includes(term));
  }, [topics.data, query]);

  return (
    <div className="space-y-8">
      <PageHeader title="Syllabus tracker" description="Mark each subject, topic and subtopic as you study. Progress is saved to your account and powers analytics." />
      <div className="grid gap-3 md:grid-cols-[1fr_220px]"><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search topics and subtopics" /><Select value={stage} onValueChange={setStage}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All stages</SelectItem>{stages.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-5">
        {filteredSubjects.map((subject) => {
          const subjectTopics = filteredTopics.filter((topic) => topic.subject_id === subject.id);
          const topLevel = subjectTopics.filter((topic) => !topic.parent_id);
          const pct = subjectTopics.length ? Math.round(subjectTopics.reduce((sum, topic) => sum + statusPercent(statusFor(topic.id)), 0) / subjectTopics.length) : 0;
          return (
            <Card key={subject.id} className="border-border/70">
              <CardHeader className="gap-3"><div className="flex flex-wrap items-center gap-3"><CardTitle className="text-xl">{subject.name}</CardTitle><span className="rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground">{subject.stage}</span><span className="ml-auto text-sm text-muted-foreground">{pct}%</span></div><p className="text-sm text-muted-foreground">{subject.description}</p><Progress value={pct} /></CardHeader>
              <CardContent className="space-y-4">
                {topLevel.map((topic) => {
                  const children = subjectTopics.filter((child) => child.parent_id === topic.id);
                  const status = statusFor(topic.id);
                  return (
                    <div key={topic.id} className="rounded-md border border-border/70 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><span className={`rounded-md border px-2 py-1 text-xs font-medium ${statusClasses(status)}`}>{statusLabel(status)}</span><Link to="/topics/$id" params={{ id: topic.id }} className="font-medium hover:underline">{topic.title}</Link></div><Select value={status} onValueChange={(v) => setStatus.mutate({ topicId: topic.id, status: v as StatusValue })}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></div>
                      {children.length ? <div className="mt-4 space-y-2 border-l border-border pl-4">{children.map((child) => { const childStatus = statusFor(child.id); return <div key={child.id} className="flex flex-wrap items-center justify-between gap-3 text-sm"><Link to="/topics/$id" params={{ id: child.id }} className="hover:underline">{child.title}</Link><div className="flex items-center gap-2"><span className={`rounded-md border px-2 py-0.5 text-xs ${statusClasses(childStatus)}`}>{statusLabel(childStatus)}</span><Select value={childStatus} onValueChange={(v) => setStatus.mutate({ topicId: child.id, status: v as StatusValue })}><SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></div></div>; })}</div> : null}
                    </div>
                  );
                })}
                {!subjectTopics.length ? <p className="text-sm text-muted-foreground">No matching topics.</p> : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
