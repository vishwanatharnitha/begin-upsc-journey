import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { pageMeta } from "@/lib/pageMeta";
import { BookmarkToggle } from "@/components/BookmarkToggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/_authenticated/resources")({ head: () => pageMeta("Resources — BEGIN UPSC", "Browse admin-published UPSC articles, PDFs, videos and links."), component: ResourcesPage });

function ResourcesPage() {
  const { user } = Route.useRouteContext();
  const [query, setQuery] = useState("");
  const resources = useQuery({ queryKey: ["resources"], queryFn: async () => { const { data, error } = await supabase.from("resources").select("id, title, description, resource_type, external_url, file_url, author, subjects(name)").eq("published", true).eq("visibility", "public").order("published_date", { ascending: false }).limit(60); if (error) throw error; return data ?? []; }});
  const rows = (resources.data ?? []).filter((item) => `${item.title} ${item.description ?? ""} ${item.resource_type}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="space-y-6"><PageHeader title="Resources" description="Admin-published study resources. Uploads are kept in private storage and links are shown only when available." /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search resources" /><div className="grid gap-5 md:grid-cols-2">{rows.map((resource) => <Card key={resource.id} className="border-border/70"><CardHeader><div className="flex flex-wrap gap-2"><Badge>{resource.resource_type}</Badge>{resource.subjects?.name ? <Badge variant="secondary">{resource.subjects.name}</Badge> : null}</div><CardTitle>{resource.title}</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm leading-6 text-muted-foreground">{resource.description}</p><div className="flex flex-wrap gap-2"><BookmarkToggle userId={user.id} contentType="resource" contentId={resource.id} />{resource.external_url ? <Button asChild variant="outline" size="sm"><a href={resource.external_url} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /> Open</a></Button> : null}</div></CardContent></Card>)}{!rows.length ? <p className="text-sm text-muted-foreground">No resources match this search.</p> : null}</div></div>;
}
