import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { pageMeta } from "@/lib/pageMeta";
import { AdminGate } from "@/components/AdminGate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/admin/resources")({ head: () => pageMeta("Admin resources — BEGIN UPSC", "Create and publish resources for learners."), component: AdminResources });

function AdminResources() {
  const { isAdmin } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("article");
  const [url, setUrl] = useState("");
  const resources = useQuery({ queryKey: ["admin-resources"], enabled: isAdmin, queryFn: async () => { const { data, error } = await supabase.from("resources").select("id, title, resource_type, published, visibility").order("created_at", { ascending: false }); if (error) throw error; return data ?? []; }});
  const add = useMutation({ mutationFn: async () => { const { error } = await supabase.from("resources").insert({ title, description, resource_type: type, external_url: url || null, published: true, visibility: "public", published_date: new Date().toISOString() }); if (error) throw error; }, onSuccess: () => { setTitle(""); setDescription(""); setUrl(""); toast.success("Resource added"); queryClient.invalidateQueries({ queryKey: ["admin-resources"] }); }, onError: () => toast.error("Could not save resource.") });
  const patch = useMutation({ mutationFn: async ({ id, published }: { id: string; published: boolean }) => { const { error } = await supabase.from("resources").update({ published }).eq("id", id); if (error) throw error; }, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-resources"] }) });
  return <AdminGate isAdmin={isAdmin}><div className="space-y-6"><PageHeader title="Resources admin" description="Add public links now; private storage files can be attached by admins through backend-managed uploads." /><Card className="border-border/70"><CardHeader><CardTitle>New resource</CardTitle></CardHeader><CardContent><form className="space-y-4" onSubmit={(e) => { e.preventDefault(); add.mutate(); }}><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Resource title" required /><Select value={type} onValueChange={setType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="article">Article</SelectItem><SelectItem value="pdf">PDF</SelectItem><SelectItem value="video">Video</SelectItem><SelectItem value="link">Link</SelectItem></SelectContent></Select><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="External URL" /><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" /><Button type="submit">Save resource</Button></form></CardContent></Card><div className="space-y-3">{resources.data?.map((resource) => <Card key={resource.id} className="border-border/70"><CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6"><div><p className="font-medium">{resource.title}</p><p className="text-sm text-muted-foreground">{resource.resource_type} · {resource.visibility}</p></div><Button variant="outline" size="sm" onClick={() => patch.mutate({ id: resource.id, published: !resource.published })}>{resource.published ? "Unpublish" : "Publish"}</Button></CardContent></Card>)}</div></div></AdminGate>;
}
