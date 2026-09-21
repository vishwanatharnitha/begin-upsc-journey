import { createFileRoute, notFound } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { pageMeta } from "@/lib/pageMeta";
import { Badge } from "@/components/ui/badge";
import { BookmarkToggle } from "@/components/BookmarkToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/_authenticated/current-affairs/$id")({
  head: () => pageMeta("Current affairs detail — BEGIN UPSC", "Current affairs brief with Prelims and Mains relevance."),
  component: CurrentAffairsDetail,
});

function CurrentAffairsDetail() {
  const { id } = Route.useParams();
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const article = useQuery({ queryKey: ["current_affairs", id], queryFn: async () => { const { data, error } = await supabase.from("current_affairs").select("id, title, content, summary, category, published_date, prelims_relevance, mains_relevance, tags, is_demo, source_url").eq("id", id).eq("published", true).maybeSingle(); if (error) throw error; if (!data) throw notFound(); return data; }});
  const read = useQuery({ queryKey: ["current_affairs_read", id], queryFn: async () => { const { data, error } = await supabase.from("current_affairs_reads").select("id").eq("current_affairs_id", id).maybeSingle(); if (error) throw error; return data; }});
  const toggleRead = useMutation({
    mutationFn: async () => {
      if (read.data?.id) {
        const { error } = await supabase.from("current_affairs_reads").delete().eq("id", read.data.id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from("current_affairs_reads").upsert({ user_id: user.id, current_affairs_id: id, read_at: new Date().toISOString() }, { onConflict: "user_id,current_affairs_id" });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["current_affairs_read", id] }); queryClient.invalidateQueries({ queryKey: ["current_affairs_reads"] }); },
    onError: () => toast.error("Could not update read status."),
  });
  return <div className="space-y-6"><PageHeader title={article.data?.title ?? "Current affairs"} description={article.data?.summary} action={<div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => toggleRead.mutate()}>{read.data ? "Mark unread" : "Mark read"}</Button><BookmarkToggle userId={user.id} contentType="current_affairs" contentId={id} /></div>} /><div className="flex flex-wrap gap-2"><Badge>{article.data?.category}</Badge>{article.data?.is_demo ? <Badge variant="outline">Demo issue brief</Badge> : null}<Badge variant="secondary">{article.data?.published_date}</Badge>{read.data ? <Badge variant="default">Read</Badge> : <Badge variant="outline">Unread</Badge>}</div><Card className="border-border/70"><CardContent className="prose prose-sm max-w-none pt-6 text-foreground"><p className="whitespace-pre-wrap leading-7">{article.data?.content}</p></CardContent></Card><div className="grid gap-5 md:grid-cols-2"><Card className="border-border/70"><CardHeader><CardTitle>Prelims relevance</CardTitle></CardHeader><CardContent className="text-sm leading-6 text-muted-foreground">{article.data?.prelims_relevance ?? "Not specified."}</CardContent></Card><Card className="border-border/70"><CardHeader><CardTitle>Mains relevance</CardTitle></CardHeader><CardContent className="text-sm leading-6 text-muted-foreground">{article.data?.mains_relevance ?? "Not specified."}</CardContent></Card></div></div>;
}
