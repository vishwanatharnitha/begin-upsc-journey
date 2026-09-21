import { createFileRoute, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { pageMeta } from "@/lib/pageMeta";
import { Badge } from "@/components/ui/badge";
import { BookmarkToggle } from "@/components/BookmarkToggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/_authenticated/current-affairs/$id")({
  head: () => pageMeta("Current affairs detail — BEGIN UPSC", "Current affairs brief with Prelims and Mains relevance."),
  component: CurrentAffairsDetail,
});

function CurrentAffairsDetail() {
  const { id } = Route.useParams();
  const { user } = Route.useRouteContext();
  const article = useQuery({ queryKey: ["current_affairs", id], queryFn: async () => { const { data, error } = await supabase.from("current_affairs").select("id, title, content, summary, category, published_date, prelims_relevance, mains_relevance, tags, is_demo, source_url").eq("id", id).eq("published", true).maybeSingle(); if (error) throw error; if (!data) throw notFound(); return data; }});
  return <div className="space-y-6"><PageHeader title={article.data?.title ?? "Current affairs"} description={article.data?.summary} action={<BookmarkToggle userId={user.id} contentType="current_affairs" contentId={id} />} /><div className="flex flex-wrap gap-2"><Badge>{article.data?.category}</Badge>{article.data?.is_demo ? <Badge variant="outline">Demo issue brief</Badge> : null}<Badge variant="secondary">{article.data?.published_date}</Badge></div><Card className="border-border/70"><CardContent className="prose prose-sm max-w-none pt-6 text-foreground"><p className="whitespace-pre-wrap leading-7">{article.data?.content}</p></CardContent></Card><div className="grid gap-5 md:grid-cols-2"><Card className="border-border/70"><CardHeader><CardTitle>Prelims relevance</CardTitle></CardHeader><CardContent className="text-sm leading-6 text-muted-foreground">{article.data?.prelims_relevance ?? "Not specified."}</CardContent></Card><Card className="border-border/70"><CardHeader><CardTitle>Mains relevance</CardTitle></CardHeader><CardContent className="text-sm leading-6 text-muted-foreground">{article.data?.mains_relevance ?? "Not specified."}</CardContent></Card></div></div>;
}
