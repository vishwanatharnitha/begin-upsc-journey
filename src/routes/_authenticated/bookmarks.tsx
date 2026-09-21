import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CONTENT_TYPES } from "@/lib/upsc";
import { pageMeta } from "@/lib/pageMeta";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/PageHeader";
import { PaginationControls } from "@/components/PaginationControls";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PAGE_SIZE = 12;

export const Route = createFileRoute("/_authenticated/bookmarks")({ head: () => pageMeta("Bookmarks — BEGIN UPSC", "Central page for saved topics, current affairs, questions, resources and Mains prompts."), component: BookmarksPage });

function BookmarkLink({ type, id }: { type: string; id: string }) {
  if (type === "topic") return <Button asChild size="sm" variant="outline"><Link to="/topics/$id" params={{ id }}>Open</Link></Button>;
  if (type === "current_affairs") return <Button asChild size="sm" variant="outline"><Link to="/current-affairs/$id" params={{ id }}>Open</Link></Button>;
  if (type === "question") return <Button asChild size="sm" variant="outline"><Link to="/practice/$id" params={{ id }}>Open</Link></Button>;
  if (type === "mains_question") return <Button asChild size="sm" variant="outline"><Link to="/mains/$id" params={{ id }}>Open</Link></Button>;
  return <Button asChild size="sm" variant="outline"><Link to="/resources">Open</Link></Button>;
}

function BookmarksPage() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [page, setPage] = useState(0);
  const bookmarks = useQuery({ queryKey: ["bookmarks"], queryFn: async () => { const { data, error } = await supabase.from("bookmarks").select("id, content_type, content_id, note, created_at").order("created_at", { ascending: false }); if (error) throw error; return data ?? []; }});
  const remove = useMutation({ mutationFn: async (id: string) => { const { error } = await supabase.from("bookmarks").delete().eq("id", id); if (error) throw error; }, onSuccess: () => { toast.success("Bookmark removed"); queryClient.invalidateQueries({ queryKey: ["bookmarks"] }); }, onError: () => toast.error("Could not remove bookmark.") });
  const rows = useMemo(() => (bookmarks.data ?? []).filter((item) => { const label = `${item.content_type} ${item.note ?? ""}`.toLowerCase(); return label.includes(query.toLowerCase()) && (type === "all" || item.content_type === type); }), [bookmarks.data, query, type]);
  const pageRows = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  return <div className="space-y-6"><PageHeader title="Bookmarks" description="A single list of saved study items across the app." /><div className="grid gap-3 md:grid-cols-[1fr_220px]"><Input value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} placeholder="Search bookmarks" /><Select value={type} onValueChange={(value) => { setType(value); setPage(0); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All types</SelectItem>{CONTENT_TYPES.map((item) => <SelectItem key={item} value={item}>{item.replace("_", " ")}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-3">{pageRows.map((item) => <Card key={item.id} className="border-border/70"><CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6"><div><p className="font-medium">{item.content_type.replace("_", " ")}</p><p className="text-sm text-muted-foreground">Saved {new Date(item.created_at).toLocaleDateString()}</p>{item.note ? <p className="text-sm text-muted-foreground">{item.note}</p> : null}</div><div className="flex gap-2"><BookmarkLink type={item.content_type} id={item.content_id} /><Button variant="outline" size="sm" onClick={() => remove.mutate(item.id)}>Remove</Button></div></CardContent></Card>)}{!rows.length ? <p className="text-sm text-muted-foreground">No bookmarks match this filter.</p> : null}</div><PaginationControls page={page} pageSize={PAGE_SIZE} total={rows.length} onPageChange={setPage} /></div>;
}
