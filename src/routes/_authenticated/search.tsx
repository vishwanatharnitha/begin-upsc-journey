import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { pageMeta } from "@/lib/pageMeta";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/PageHeader";
import { PaginationControls } from "@/components/PaginationControls";

const PAGE_SIZE = 15;

export const Route = createFileRoute("/_authenticated/search")({ head: () => pageMeta("Search — BEGIN UPSC", "Search syllabus, current affairs, questions, Mains prompts and resources."), component: SearchPage });

function SearchPage() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const enabled = query.trim().length >= 2;
  const results = useQuery({ queryKey: ["global-search", query], enabled, queryFn: async () => {
    const term = `%${query.trim()}%`;
    const [topics, affairs, questions, mains, resources] = await Promise.all([
      supabase.from("syllabus_topics").select("id, title").ilike("title", term).limit(25),
      supabase.from("current_affairs").select("id, title").eq("published", true).ilike("title", term).limit(25),
      supabase.from("questions").select("id, question_text").eq("published", true).ilike("question_text", term).limit(25),
      supabase.from("mains_questions").select("id, question_text").eq("published", true).ilike("question_text", term).limit(25),
      supabase.from("resources").select("id, title").eq("published", true).ilike("title", term).limit(25),
    ]);
    const errors = [topics.error, affairs.error, questions.error, mains.error, resources.error].filter(Boolean);
    if (errors.length) throw errors[0];
    return [
      ...(topics.data ?? []).map((item) => ({ type: "Topic", title: item.title, to: "/topics/$id" as const, id: item.id })),
      ...(affairs.data ?? []).map((item) => ({ type: "Current affairs", title: item.title, to: "/current-affairs/$id" as const, id: item.id })),
      ...(questions.data ?? []).map((item) => ({ type: "Question", title: item.question_text, to: "/practice/$id" as const, id: item.id })),
      ...(mains.data ?? []).map((item) => ({ type: "Mains", title: item.question_text, to: "/mains/$id" as const, id: item.id })),
      ...(resources.data ?? []).map((item) => ({ type: "Resource", title: item.title, to: "/resources" as const, id: item.id })),
    ];
  }});
  const rows = results.data ?? [];
  const pageRows = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  return <div className="space-y-6"><PageHeader title="Search" description="Database-backed search across the preparation workspace." /><Input value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} placeholder="Type at least two characters" /><div className="space-y-3">{pageRows.map((item) => <Card key={`${item.type}-${item.id}`} className="border-border/70"><CardContent className="pt-6"><p className="text-xs uppercase tracking-wider text-muted-foreground">{item.type}</p>{item.to === "/resources" ? <Link to="/resources" className="font-medium hover:underline">{item.title}</Link> : <Link to={item.to} params={{ id: item.id }} className="font-medium hover:underline">{item.title}</Link>}</CardContent></Card>)}{enabled && rows.length === 0 ? <p className="text-sm text-muted-foreground">No results found.</p> : null}{!enabled ? <p className="text-sm text-muted-foreground">Enter at least two characters to search.</p> : null}</div><PaginationControls page={page} pageSize={PAGE_SIZE} total={rows.length} onPageChange={setPage} /></div>;
}
