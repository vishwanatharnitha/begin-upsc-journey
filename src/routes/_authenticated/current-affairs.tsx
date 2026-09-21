import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CA_CATEGORIES } from "@/lib/upsc";
import { pageMeta } from "@/lib/pageMeta";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/current-affairs")({
  head: () => pageMeta("Current affairs — BEGIN UPSC", "Read admin-managed current affairs issue briefs with category filters and syllabus relevance."),
  component: CurrentAffairsPage,
});

function CurrentAffairsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const affairs = useQuery({
    queryKey: ["current_affairs", category],
    queryFn: async () => {
      let request = supabase
        .from("current_affairs")
        .select("id, title, summary, category, published_date, tags, is_demo")
        .eq("published", true)
        .order("published_date", { ascending: false })
        .limit(30);
      if (category !== "all") request = request.eq("category", category);
      const { data, error } = await request;
      if (error) throw error;
      return data ?? [];
    },
  });
  const rows = (affairs.data ?? []).filter((item) => `${item.title} ${item.summary} ${item.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="space-y-6">
      <PageHeader title="Current affairs" description="Issue briefs are published by admins. Demo records are clearly labelled and are not real-time news." />
      <div className="grid gap-3 md:grid-cols-[1fr_260px]"><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search current affairs" /><Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All categories</SelectItem>{CA_CATEGORIES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
      <div className="grid gap-5 md:grid-cols-2">
        {rows.map((item) => <Card key={item.id} className="border-border/70"><CardHeader><div className="flex flex-wrap gap-2"><Badge variant="secondary">{item.category}</Badge>{item.is_demo ? <Badge variant="outline">Demo issue brief</Badge> : null}</div><CardTitle className="text-xl"><Link to="/current-affairs/$id" params={{ id: item.id }} className="hover:underline">{item.title}</Link></CardTitle><p className="text-xs text-muted-foreground">{item.published_date}</p></CardHeader><CardContent><p className="text-sm leading-6 text-muted-foreground">{item.summary}</p></CardContent></Card>)}
        {!rows.length ? <Card className="border-dashed border-border"><CardContent className="py-12 text-center text-sm text-muted-foreground">No published current affairs match this filter.</CardContent></Card> : null}
      </div>
    </div>
  );
}
