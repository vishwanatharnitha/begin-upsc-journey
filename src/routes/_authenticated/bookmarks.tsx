import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { pageMeta } from "@/lib/pageMeta";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/_authenticated/bookmarks")({ head: () => pageMeta("Bookmarks — BEGIN UPSC", "Central page for saved topics, current affairs, questions, resources and Mains prompts."), component: BookmarksPage });

function BookmarksPage() {
  const queryClient = useQueryClient();
  const bookmarks = useQuery({ queryKey: ["bookmarks"], queryFn: async () => { const { data, error } = await supabase.from("bookmarks").select("id, content_type, content_id, note, created_at").order("created_at", { ascending: false }); if (error) throw error; return data ?? []; }});
  const remove = useMutation({ mutationFn: async (id: string) => { const { error } = await supabase.from("bookmarks").delete().eq("id", id); if (error) throw error; }, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bookmarks"] }) });
  return <div className="space-y-6"><PageHeader title="Bookmarks" description="A single list of saved study items across the app." /><div className="grid gap-3">{bookmarks.data?.map((item) => <Card key={item.id} className="border-border/70"><CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6"><div><p className="font-medium">{item.content_type.replace("_", " ")}</p><p className="text-sm text-muted-foreground">Saved {new Date(item.created_at).toLocaleDateString()}</p></div><Button variant="outline" size="sm" onClick={() => remove.mutate(item.id)}>Remove</Button></CardContent></Card>)}{bookmarks.data?.length === 0 ? <p className="text-sm text-muted-foreground">No bookmarks yet.</p> : null}</div></div>;
}
