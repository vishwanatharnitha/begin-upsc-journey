import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { pageMeta } from "@/lib/pageMeta";
import { statusLabel } from "@/lib/upsc";
import { DataBar } from "@/components/DataBar";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/subjects/$id")({ head: () => pageMeta("Subject detail — BEGIN UPSC", "Review subject topics, progress, questions and resources."), component: SubjectDetail });

function SubjectDetail() {
  const { id } = Route.useParams();
  const subject = useQuery({ queryKey: ["subject", id], queryFn: async () => { const { data, error } = await supabase.from("subjects").select("id, name, stage, paper, description").eq("id", id).maybeSingle(); if (error) throw error; if (!data) throw notFound(); return data; }});
  const topics = useQuery({ queryKey: ["subject-topics", id], queryFn: async () => { const { data, error } = await supabase.from("syllabus_topics").select("id, title, parent_id, description, topic_progress(status, progress_percentage)").eq("subject_id", id).order("display_order"); if (error) throw error; return data ?? []; }});
  const resources = useQuery({ queryKey: ["subject-resources", id], queryFn: async () => { const { data, error } = await supabase.from("resources").select("id, title, resource_type, description, external_url").eq("subject_id", id).eq("published", true).limit(6); if (error) throw error; return data ?? []; }});
  const avg = topics.data?.length ? Math.round(topics.data.reduce((sum, topic) => sum + (topic.topic_progress?.[0]?.progress_percentage ?? 0), 0) / topics.data.length) : 0;
  return <div className="space-y-6"><PageHeader title={subject.data?.name ?? "Subject"} description={subject.data?.description ?? "Subject detail"} /><Card className="border-border/70"><CardContent className="pt-6"><DataBar label="Subject progress" value={avg} max={100} detail={`${avg}%`} /></CardContent></Card><div className="grid gap-6 lg:grid-cols-[1fr_340px]"><Card className="border-border/70"><CardHeader><CardTitle>Topics</CardTitle></CardHeader><CardContent className="space-y-3">{topics.data?.map((topic) => <Link key={topic.id} to="/topics/$id" params={{ id: topic.id }} className="block rounded-md border border-border/70 p-3 hover:bg-secondary"><p className="font-medium">{topic.title}</p><p className="text-xs text-muted-foreground">{statusLabel(topic.topic_progress?.[0]?.status ?? "not_started")}</p></Link>)}</CardContent></Card><Card className="border-border/70"><CardHeader><CardTitle>Resources</CardTitle></CardHeader><CardContent className="space-y-3">{resources.data?.map((resource) => <div key={resource.id} className="rounded-md border border-border/70 p-3"><p className="font-medium">{resource.title}</p><p className="text-xs text-muted-foreground">{resource.resource_type}</p></div>)}{!resources.data?.length ? <p className="text-sm text-muted-foreground">No published resources yet.</p> : null}</CardContent></Card></div></div>;
}
