import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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

type ResourceRow = { id: string; title: string; description: string | null; resource_type: string; external_url: string | null; file_url: string | null; author: string | null; published: boolean; visibility: string };

export const Route = createFileRoute("/_authenticated/admin/resources")({ head: () => pageMeta("Admin resources — BEGIN UPSC", "Create, edit, publish, unpublish and delete learner resources."), component: AdminResources });

function AdminResources() {
  const { isAdmin } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("article");
  const [url, setUrl] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [author, setAuthor] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [published, setPublished] = useState(false);
  const resources = useQuery({ queryKey: ["admin-resources"], enabled: isAdmin, queryFn: async () => { const { data, error } = await supabase.from("resources").select("id, title, description, resource_type, external_url, file_url, author, published, visibility").order("created_at", { ascending: false }).limit(120); if (error) throw error; return (data ?? []) as ResourceRow[]; }});
  function resetForm() { setEditingId(null); setTitle(""); setDescription(""); setType("article"); setUrl(""); setFileUrl(""); setAuthor(""); setVisibility("public"); setPublished(false); }
  function edit(resource: ResourceRow) { setEditingId(resource.id); setTitle(resource.title); setDescription(resource.description ?? ""); setType(resource.resource_type); setUrl(resource.external_url ?? ""); setFileUrl(resource.file_url ?? ""); setAuthor(resource.author ?? ""); setVisibility(resource.visibility); setPublished(resource.published); }
  const save = useMutation({ mutationFn: async () => { const payload = { title: title.trim(), description: description.trim() || null, resource_type: type, external_url: url.trim() || null, file_url: fileUrl.trim() || null, author: author.trim() || null, visibility, published, published_date: published ? new Date().toISOString() : null }; const response = editingId ? await supabase.from("resources").update(payload).eq("id", editingId) : await supabase.from("resources").insert(payload); if (response.error) throw response.error; }, onSuccess: () => { resetForm(); toast.success("Resource saved"); queryClient.invalidateQueries({ queryKey: ["admin-resources"] }); queryClient.invalidateQueries({ queryKey: ["resources"] }); }, onError: () => toast.error("Could not save resource.") });
  const patch = useMutation({ mutationFn: async ({ id, published: next }: { id: string; published: boolean }) => { const { error } = await supabase.from("resources").update({ published: next, published_date: next ? new Date().toISOString() : null }).eq("id", id); if (error) throw error; }, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-resources"] }), onError: () => toast.error("Could not update resource.") });
  const remove = useMutation({ mutationFn: async (id: string) => { const { error } = await supabase.from("resources").delete().eq("id", id); if (error) throw error; }, onSuccess: () => { toast.success("Resource deleted"); queryClient.invalidateQueries({ queryKey: ["admin-resources"] }); }, onError: () => toast.error("Could not delete resource.") });
  return <AdminGate isAdmin={isAdmin}><div className="space-y-6"><PageHeader title="Resources admin" description="Manage public links and storage-backed resource URLs. New resources are drafts by default." /><Card className="border-border/70"><CardHeader><CardTitle>{editingId ? "Edit resource" : "New resource"}</CardTitle></CardHeader><CardContent><form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Resource title" required /><div className="grid gap-3 md:grid-cols-2"><Select value={type} onValueChange={setType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="article">Article</SelectItem><SelectItem value="pdf">PDF</SelectItem><SelectItem value="video">Video</SelectItem><SelectItem value="link">Link</SelectItem><SelectItem value="notes">Notes</SelectItem></SelectContent></Select><Select value={visibility} onValueChange={setVisibility}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="public">Public</SelectItem><SelectItem value="private">Private</SelectItem></SelectContent></Select></div><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="External URL" /><Input value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="Storage file URL" /><Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author" /><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" /><Label className="flex items-center gap-2"><Checkbox checked={published} onCheckedChange={(checked) => setPublished(Boolean(checked))} /> Publish now</Label><div className="flex gap-2"><Button type="submit" disabled={save.isPending}>{editingId ? "Update resource" : "Save resource"}</Button>{editingId ? <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button> : null}</div></form></CardContent></Card><div className="space-y-3">{resources.data?.map((resource) => <Card key={resource.id} className="border-border/70"><CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6"><div><p className="font-medium">{resource.title}</p><p className="text-sm text-muted-foreground">{resource.resource_type} · {resource.visibility} · {resource.published ? "Published" : "Draft"}</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => edit(resource)}>Edit</Button><Button variant="outline" size="sm" onClick={() => patch.mutate({ id: resource.id, published: !resource.published })}>{resource.published ? "Unpublish" : "Publish"}</Button><Button variant="destructive" size="sm" onClick={() => remove.mutate(resource.id)}>Delete</Button></div></CardContent></Card>)}</div></div></AdminGate>;
}
