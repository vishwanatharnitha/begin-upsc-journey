import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { pageMeta } from "@/lib/pageMeta";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/PageHeader";
import { PaginationControls } from "@/components/PaginationControls";

const PAGE_SIZE = 12;

export const Route = createFileRoute("/_authenticated/practice")({ head: () => pageMeta("MCQ practice — BEGIN UPSC", "Practice published UPSC MCQs by subject, topic and difficulty."), component: PracticePage });

function PracticePage() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const questions = useQuery({ queryKey: ["questions"], queryFn: async () => { const { data, error } = await supabase.from("questions").select("id, question_text, difficulty, question_type, tags, subjects(name)").eq("published", true).order("created_at", { ascending: false }).limit(120); if (error) throw error; return data ?? []; }});
  const rows = (questions.data ?? []).filter((q) => `${q.question_text} ${q.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase()));
  const pageRows = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  return <div className="space-y-6"><PageHeader title="MCQ practice" description="Choose a published question. Attempts are saved only after you submit an answer." /><Input value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} placeholder="Search questions, tags or topics" /><div className="grid gap-4">{pageRows.map((question) => <Card key={question.id} className="border-border/70"><CardHeader><div className="flex flex-wrap gap-2"><Badge variant="secondary">{question.difficulty}</Badge><Badge variant="outline">{question.question_type}</Badge>{question.subjects?.name ? <Badge>{question.subjects.name}</Badge> : null}</div><CardTitle className="text-lg"><Link to="/practice/$id" params={{ id: question.id }} className="hover:underline">{question.question_text}</Link></CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">{question.tags.slice(0, 4).join(" · ") || "No tags"}</CardContent></Card>)}{!rows.length ? <p className="text-sm text-muted-foreground">No published questions found.</p> : null}</div><PaginationControls page={page} pageSize={PAGE_SIZE} total={rows.length} onPageChange={setPage} /></div>;
}
