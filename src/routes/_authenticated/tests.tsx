import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Clock, HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { pageMeta } from "@/lib/pageMeta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/_authenticated/tests")({ head: () => pageMeta("Tests — BEGIN UPSC", "Take published mock tests and review saved attempt results."), component: TestsPage });

function TestsPage() {
  const tests = useQuery({ queryKey: ["tests"], queryFn: async () => { const { data, error } = await supabase.from("tests").select("id, title, description, test_type, duration_minutes, total_questions, subjects(name)").eq("published", true).order("created_at", { ascending: false }); if (error) throw error; return data ?? []; }});
  return <div className="space-y-6"><PageHeader title="Tests" description="Published tests are managed by admins. Results appear after you submit." /><div className="grid gap-5 md:grid-cols-2">{tests.data?.map((test) => <Card key={test.id} className="border-border/70"><CardHeader><div className="flex flex-wrap gap-2"><Badge>{test.test_type}</Badge><Badge variant="outline"><Clock className="h-3 w-3" /> {test.duration_minutes} min</Badge><Badge variant="secondary"><HelpCircle className="h-3 w-3" /> {test.total_questions} questions</Badge></div><CardTitle>{test.title}</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm text-muted-foreground">{test.description}</p><Button asChild><Link to="/tests/$id" params={{ id: test.id }}>Start test</Link></Button></CardContent></Card>)}{tests.data?.length === 0 ? <p className="text-sm text-muted-foreground">No published tests yet.</p> : null}</div></div>;
}
