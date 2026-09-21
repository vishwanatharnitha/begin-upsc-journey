import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CA_CATEGORIES } from "@/lib/upsc";
import { pageMeta } from "@/lib/pageMeta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/PageHeader";
import { PaginationControls } from "@/components/PaginationControls";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PAGE_SIZE = 12;

export const Route = createFileRoute("/_authenticated/current-affairs")({
  head: () => pageMeta("Current affairs — BEGIN UPSC", "Read admin-managed current affairs issue briefs with category filters and syllabus relevance."),
  component: CurrentAffairsPage,
});

function CurrentAffairsPage() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [readFilter, setReadFilter] = useState("all");
  const [page, setPage] = useState(0);

  const affairs = useQuery({
    queryKey: ["current_affairs", category],
    queryFn: async () => {
      let request = supabase
        .from("current_affairs")
        .select("id, title, summary, category, published_date, tags, is_demo")
        .eq("published", true)
        .order("published_date", { ascending: false })
        .limit(120);
      if (category !== "all") request = request.eq("category", category);
      const { data, error } = await request;
      if (error) throw error;
      return data ?? [];
    },
  });

  const reads = useQuery({
    queryKey: ["current_affairs_reads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("current_affairs_reads").select("id, current_affairs_id");
      if (error) throw error;
      return data ?? [];
    },
  });

  const readIds = useMemo(() => new Set((reads.data ?? []).map((item) => item.current_affairs_id)), [reads.data]);
  const rows = (affairs.data ?? []).filter((item) => {
    const termMatch = `${item.title} ${item.summary} ${item.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase());
    const readMatch = readFilter === "all" || (readFilter === "read" ? readIds.has(item.id) : !readIds.has(item.id));
    return termMatch && readMatch;
  });
  const pageRows = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleRead = useMutation({
    mutationFn: async ({ id, read }: { id: string; read: boolean }) => {
      if (read) {
        const { error } = await supabase.from("current_affairs_reads").delete().eq("current_affairs_id", id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from("current_affairs_reads").upsert({ user_id: user.id, current_affairs_id: id, read_at: new Date().toISOString() }, { onConflict: "user_id,current_affairs_id" });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["current_affairs_reads"] }),
    onError: () => toast.error("Could not update read status."),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Current affairs" description="Issue briefs are published by admins. Demo records are clearly labelled and are not real-time news." />
      <div className="grid gap-3 lg:grid-cols-[1fr_220px_180px]">
        <Input value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} placeholder="Search current affairs" />
        <Select value={category} onValueChange={(value) => { setCategory(value); setPage(0); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All categories</SelectItem>{CA_CATEGORIES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
        <Select value={readFilter} onValueChange={(value) => { setReadFilter(value); setPage(0); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All items</SelectItem><SelectItem value="unread">Unread</SelectItem><SelectItem value="read">Read</SelectItem></SelectContent></Select>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {pageRows.map((item) => {
          const isRead = readIds.has(item.id);
          return (
            <Card key={item.id} className="border-border/70">
              <CardHeader>
                <div className="flex flex-wrap gap-2"><Badge variant="secondary">{item.category}</Badge>{item.is_demo ? <Badge variant="outline">Demo issue brief</Badge> : null}<Badge variant={isRead ? "default" : "outline"}>{isRead ? "Read" : "Unread"}</Badge></div>
                <CardTitle className="text-xl"><Link to="/current-affairs/$id" params={{ id: item.id }} className="hover:underline">{item.title}</Link></CardTitle>
                <p className="text-xs text-muted-foreground">{item.published_date}</p>
              </CardHeader>
              <CardContent className="space-y-4"><p className="text-sm leading-6 text-muted-foreground">{item.summary}</p><Button variant="outline" size="sm" onClick={() => toggleRead.mutate({ id: item.id, read: isRead })}>{isRead ? "Mark unread" : "Mark read"}</Button></CardContent>
            </Card>
          );
        })}
        {!rows.length ? <Card className="border-dashed border-border"><CardContent className="py-12 text-center text-sm text-muted-foreground">No published current affairs match this filter.</CardContent></Card> : null}
      </div>
      <PaginationControls page={page} pageSize={PAGE_SIZE} total={rows.length} onPageChange={setPage} />
    </div>
  );
}
