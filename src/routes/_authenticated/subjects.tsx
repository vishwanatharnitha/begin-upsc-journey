import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { pageMeta } from "@/lib/pageMeta";
import { DataBar } from "@/components/DataBar";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/subjects")({ head: () => pageMeta("Subjects — BEGIN UPSC", "Browse UPSC subjects with progress and linked topics."), component: SubjectsPage });

function SubjectsPage() {
  const [query, setQuery] = useState("");
  const subjects = useQuery({ queryKey: ["subjects"], queryFn: async () => { const { data, error } = await supabase.from("subjects").select("id, name, slug, stage, paper, description, syllabus_topics(id), topic_progress(progress_percentage)").order("display_order"); if (error) throw error; return data ?? []; }});
  const rows = (subjects.data ?? []).filter((s) => `${s.name} ${s.stage} ${s.description ?? ""}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="space-y-6"><PageHeader title="Subjects" description="Search all Prelims and Mains subjects. Open a subject for linked topics and resources." /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search subjects" /><div className="grid gap-5 md:grid-cols-2">{rows.map((subject) => { const total = subject.syllabus_topics?.length ?? 0; const pct = total ? Math.round((subject.topic_progress?.reduce((sum, p) => sum + (p.progress_percentage ?? 0), 0) ?? 0) / total) : 0; return <Card key={subject.id} className="border-border/70"><CardHeader><CardTitle><Link to="/subjects/$id" params={{ id: subject.id }} className="hover:underline">{subject.name}</Link></CardTitle><p className="text-sm text-muted-foreground">{subject.stage}{subject.paper ? ` · ${subject.paper}` : ""}</p></CardHeader><CardContent className="space-y-4"><p className="text-sm text-muted-foreground">{subject.description}</p><DataBar label="Progress" value={pct} max={100} detail={`${pct}% · ${total} topics`} /></CardContent></Card>; })}</div></div>;
}
