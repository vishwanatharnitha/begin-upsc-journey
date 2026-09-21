import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CA_CATEGORIES } from "@/lib/upsc";
import { pageMeta } from "@/lib/pageMeta";
import { AdminGate } from "@/components/AdminGate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/admin/current-affairs")({ head: () => pageMeta("Admin current affairs — BEGIN UPSC", "Create and publish syllabus-linked current affairs issue briefs."), component: AdminCurrentAffairs });

function AdminCurrentAffairs() {
  const { isAdmin } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState(CA_CATEGORIES[0] ?? "Polity");
  const affairs = useQuery({ queryKey: ["admin-current-affairs"], enabled: isAdmin, queryFn: async () => { const { data, error } = await supabase.from("current_affairs").select("id, title, category, published, is_demo, published_date").order("published_date", { ascending: false }); if (error) throw error; return data ?? []; }});
  const add = useMutation({ mutationFn: async () => { const { error } = await supabase.from("current_affairs").insert({ title, summary, content, category, published: true, is_demo: false }); if (error) throw error; }, onSuccess: () => { setTitle(""); setSummary(""); setContent(""); toast.success("Current affairs brief added"); queryClient.invalidateQueries({ queryKey: ["admin-current-affairs"] }); }, onError: () => toast.error("Could not save current affairs brief.") });
  const patch = useMutation({ mutationFn: async ({ id, published }: { id: string; published: boolean }) => { const { error } = await supabase.from("current_affairs").update({ published }).eq("id", id); if (error) throw error; }, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-current-affairs"] }) });
  return <AdminGate isAdmin={isAdmin}><div className="space-y-6"><PageHeader title="Current affairs admin" description="Publish only verified briefs. Demo records must stay labelled as demo." /><Card className="border-border/70"><CardHeader><CardTitle>New brief</CardTitle></CardHeader><CardContent><form className="space-y-4" onSubmit={(e) => { e.preventDefault(); add.mutate(); }}><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" required /><Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CA_CATEGORIES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select><Textarea value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Summary" required /><Textarea rows={7} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Brief content" required /><Button type="submit">Publish brief</Button></form></CardContent></Card><div className="space-y-3">{affairs.data?.map((item) => <Card key={item.id} className="border-border/70"><CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6"><div><p className="font-medium">{item.title}</p><p className="text-sm text-muted-foreground">{item.category} · {item.is_demo ? "Demo" : "Original"}</p></div><Button variant="outline" size="sm" onClick={() => patch.mutate({ id: item.id, published: !item.published })}>{item.published ? "Unpublish" : "Publish"}</Button></CardContent></Card>)}</div></div></AdminGate>;
}
