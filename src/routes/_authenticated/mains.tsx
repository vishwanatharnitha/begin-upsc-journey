import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { pageMeta } from "@/lib/pageMeta";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/PageHeader";
import { PaginationControls } from "@/components/PaginationControls";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PAGE_SIZE = 12;

export const Route = createFileRoute("/_authenticated/mains")({ head: () => pageMeta("Mains answer writing — BEGIN UPSC", "Write Mains answers, save submissions and receive clearly labelled AI-assisted feedback."), component: MainsPage });

function MainsPage() {
  const [query, setQuery] = useState("");
  const [paper, setPaper] = useState("all");
  const [page, setPage] = useState(0);
  const questions = useQuery({ queryKey: ["mains_questions"], queryFn: async () => { const { data, error } = await supabase.from("mains_questions").select("id, question_text, paper, difficulty, word_limit, marks").eq("published", true).order("created_at", { ascending: false }).limit(120); if (error) throw error; return data ?? []; }});
  const submissions = useQuery({ queryKey: ["mains_submissions"], queryFn: async () => { const { data, error } = await supabase.from("mains_submissions").select("question_id, status, updated_at").order("updated_at", { ascending: false }); if (error) throw error; return data ?? []; }});
  const papers = useMemo(() => Array.from(new Set((questions.data ?? []).map((item) => item.paper))), [questions.data]);
  const rows = (questions.data ?? []).filter((question) => {
    const term = `${question.question_text} ${question.paper} ${question.difficulty}`.toLowerCase();
    return term.includes(query.toLowerCase()) && (paper === "all" || question.paper === paper);
  });
  const pageRows = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const latestStatus = (id: string) => submissions.data?.find((item) => item.question_id === id)?.status;
  return <div className="space-y-6"><PageHeader title="Mains answer writing" description="Pick a question, write with word count, save drafts, submit answers and review your history." /><div className="grid gap-3 md:grid-cols-[1fr_240px]"><Input value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} placeholder="Search Mains prompts" /><Select value={paper} onValueChange={(value) => { setPaper(value); setPage(0); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All papers</SelectItem>{papers.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-5">{pageRows.map((question) => <Card key={question.id} className="border-border/70"><CardHeader><div className="flex flex-wrap gap-2"><Badge>{question.paper}</Badge><Badge variant="secondary">{question.difficulty}</Badge><Badge variant="outline">{question.word_limit} words · {question.marks} marks</Badge>{latestStatus(question.id) ? <Badge variant="default">{latestStatus(question.id)}</Badge> : null}</div><CardTitle className="text-lg leading-7"><Link to="/mains/$id" params={{ id: question.id }} className="hover:underline">{question.question_text}</Link></CardTitle></CardHeader></Card>)}{questions.data?.length === 0 ? <p className="text-sm text-muted-foreground">No published Mains questions yet.</p> : null}</div><PaginationControls page={page} pageSize={PAGE_SIZE} total={rows.length} onPageChange={setPage} /></div>;
}
