import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { STATUSES, statusPercent, type StatusValue } from "@/lib/upsc";
import { pageMeta } from "@/lib/pageMeta";
import { BookmarkToggle } from "@/components/BookmarkToggle";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/topics/$id")({ head: () => pageMeta("Topic — BEGIN UPSC", "Review a syllabus topic, linked resources and saved progress."), component: TopicDetail });

function TopicDetail() {
  const { id } = Route.useParams();
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const topic = useQuery({ queryKey: ["topic", id], queryFn: async () => { const { data, error } = await supabase.from("syllabus_topics").select("id, title, description, subject_id, subjects(name), topic_progress(status)").eq("id", id).maybeSingle(); if (error) throw error; if (!data) throw notFound(); return data; }});
  const children = useQuery({ queryKey: ["topic-children", id], queryFn: async () => { const { data, error } = await supabase.from("syllabus_topics").select("id, title, topic_progress(status)").eq("parent_id", id).order("display_order"); if (error) throw error; return data ?? []; }});
  const resources = useQuery({ queryKey: ["topic-resources", id], queryFn: async () => { const { data, error } = await supabase.from("resources").select("id, title, resource_type, description, external_url, file_url").eq("topic_id", id).eq("published", true); if (error) throw error; return data ?? []; }});
  const currentStatus = topic.data?.topic_progress?.[0]?.status ?? "not_started";
  const update = useMutation({ mutationFn: async (status: StatusValue) => { const { error } = await supabase.from("topic_progress").upsert({ user_id: user.id, topic_id: id, status, progress_percentage: statusPercent(status), completed_at: status === "done" ? new Date().toISOString() : null }, { onConflict: "user_id,topic_id" }); if (error) throw error; }, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["topic", id] }); toast.success("Progress updated"); }, onError: () => toast.error("Could not update progress") });
  return <div className="space-y-6"><PageHeader title={topic.data?.title ?? "Topic"} description={topic.data?.description ?? "Syllabus topic"} action={<div className="flex flex-wrap gap-2"><Button asChild variant="outline" size="sm"><Link to="/notes">Add note</Link></Button><BookmarkToggle userId={user.id} contentType="topic" contentId={id} /></div>} /><Card className="border-border/70"><CardContent className="flex flex-wrap items-center gap-3 pt-6"><span className="text-sm text-muted-foreground">Progress</span><Select value={currentStatus} onValueChange={(v) => update.mutate(v as StatusValue)}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></CardContent></Card><div className="grid gap-6 lg:grid-cols-2"><Card className="border-border/70"><CardHeader><CardTitle>Subtopics</CardTitle></CardHeader><CardContent className="space-y-3">{children.data?.map((child) => <Link key={child.id} to="/topics/$id" params={{ id: child.id }} className="block rounded-md border border-border/70 p-3 hover:bg-secondary"><p className="font-medium">{child.title}</p><p className="text-xs text-muted-foreground">{child.topic_progress?.[0]?.status ?? "not_started"}</p></Link>)}{!children.data?.length ? <p className="text-sm text-muted-foreground">No subtopics under this topic.</p> : null}</CardContent></Card><Card className="border-border/70"><CardHeader><CardTitle>Resources</CardTitle></CardHeader><CardContent className="space-y-3">{resources.data?.map((resource) => { const href = resource.external_url ?? resource.file_url; return <div key={resource.id} className="rounded-md border border-border/70 p-3"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-medium">{resource.title}</p><p className="text-sm text-muted-foreground">{resource.description}</p></div>{href ? <Button asChild variant="outline" size="sm"><a href={href} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /> Open</a></Button> : null}</div></div>; })}{!resources.data?.length ? <p className="text-sm text-muted-foreground">No resources linked yet.</p> : null}</CardContent></Card></div></div>;
}
