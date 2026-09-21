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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type CurrentAffairsRow = { id: string; title: string; summary: string; content: string; category: string; published: boolean; is_demo: boolean; published_date: string; prelims_relevance: string | null; mains_relevance: string | null; source_url: string | null; tags: string[] };

export const Route = createFileRoute("/_authenticated/admin/current-affairs")({ head: () => pageMeta("Admin current affairs — BEGIN UPSC", "Create, edit, publish, unpublish and delete syllabus-linked current affairs briefs."), component: AdminCurrentAffairs });

function AdminCurrentAffairs() {
  const { isAdmin } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState(CA_CATEGORIES[0] ?? "Polity");
  const [prelims, setPrelims] = useState("");
  const [mains, setMains] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [tags, setTags] = useState("");
  const [published, setPublished] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const affairs = useQuery({ queryKey: ["admin-current-affairs"], enabled: isAdmin, queryFn: async () => { const { data, error } = await supabase.from("current_affairs").select("id, title, summary, content, category, published, is_demo, published_date, prelims_relevance, mains_relevance, source_url, tags").order("published_date", { ascending: false }).limit(120); if (error) throw error; return (data ?? []) as CurrentAffairsRow[]; }});
  function resetForm() { setEditingId(null); setTitle(""); setSummary(""); setContent(""); setCategory(CA_CATEGORIES[0] ?? "Polity"); setPrelims(""); setMains(""); setSourceUrl(""); setTags(""); setPublished(false); setIsDemo(false); }
  function edit(item: CurrentAffairsRow) { setEditingId(item.id); setTitle(item.title); setSummary(item.summary); setContent(item.content); setCategory(item.category); setPrelims(item.prelims_relevance ?? ""); setMains(item.mains_relevance ?? ""); setSourceUrl(item.source_url ?? ""); setTags(item.tags.join(", ")); setPublished(item.published); setIsDemo(item.is_demo); }
  const save = useMutation({ mutationFn: async () => { const payload = { title: title.trim(), summary: summary.trim(), content: content.trim(), category, prelims_relevance: prelims.trim() || null, mains_relevance: mains.trim() || null, source_url: sourceUrl.trim() || null, tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean), published, is_demo: isDemo }; const response = editingId ? await supabase.from("current_affairs").update(payload).eq("id", editingId) : await supabase.from("current_affairs").insert(payload); if (response.error) throw response.error; }, onSuccess: () => { resetForm(); toast.success("Current affairs brief saved"); queryClient.invalidateQueries({ queryKey: ["admin-current-affairs"] }); queryClient.invalidateQueries({ queryKey: ["current_affairs"] }); }, onError: () => toast.error("Could not save current affairs brief.") });
  const patch = useMutation({ mutationFn: async ({ id, published: next }: { id: string; published: boolean }) => { const { error } = await supabase.from("current_affairs").update({ published: next }).eq("id", id); if (error) throw error; }, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-current-affairs"] }), onError: () => toast.error("Could not update brief.") });
  const remove = useMutation({ mutationFn: async (id: string) => { const { error } = await supabase.from("current_affairs").delete().eq("id", id); if (error) throw error; }, onSuccess: () => { toast.success("Brief deleted"); queryClient.invalidateQueries({ queryKey: ["admin-current-affairs"] }); }, onError: () => toast.error("Could not delete brief.") });
  return <AdminGate isAdmin={isAdmin}><div className="space-y-6"><PageHeader title="Current affairs admin" description="Publish only verified briefs. New briefs stay draft until you choose Publish now." /><Card className="border-border/70"><CardHeader><CardTitle>{editingId ? "Edit brief" : "New brief"}</CardTitle></CardHeader><CardContent><form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" required /><Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CA_CATEGORIES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select><Textarea value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Summary" required /><Textarea rows={7} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Brief content" required /><div className="grid gap-3 md:grid-cols-2"><Textarea value={prelims} onChange={(e) => setPrelims(e.target.value)} placeholder="Prelims relevance" /><Textarea value={mains} onChange={(e) => setMains(e.target.value)} placeholder="Mains relevance" /></div><Input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="Source URL" /><Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tags, comma separated" /><div className="flex flex-wrap gap-4"><Label className="flex items-center gap-2"><Checkbox checked={published} onCheckedChange={(checked) => setPublished(Boolean(checked))} /> Publish now</Label><Label className="flex items-center gap-2"><Checkbox checked={isDemo} onCheckedChange={(checked) => setIsDemo(Boolean(checked))} /> Demo issue brief</Label></div><div className="flex gap-2"><Button type="submit" disabled={save.isPending}>{editingId ? "Update brief" : "Save brief"}</Button>{editingId ? <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button> : null}</div></form></CardContent></Card><div className="space-y-3">{affairs.data?.map((item) => <Card key={item.id} className="border-border/70"><CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6"><div><p className="font-medium">{item.title}</p><p className="text-sm text-muted-foreground">{item.category} · {item.published ? "Published" : "Draft"} · {item.is_demo ? "Demo" : "Original"}</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => edit(item)}>Edit</Button><Button variant="outline" size="sm" onClick={() => patch.mutate({ id: item.id, published: !item.published })}>{item.published ? "Unpublish" : "Publish"}</Button><Button variant="destructive" size="sm" onClick={() => remove.mutate(item.id)}>Delete</Button></div></CardContent></Card>)}</div></div></AdminGate>;
}
