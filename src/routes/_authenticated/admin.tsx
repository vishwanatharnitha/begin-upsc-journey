import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { pageMeta } from "@/lib/pageMeta";
import { AdminGate } from "@/components/AdminGate";
import { MetricCard } from "@/components/MetricCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/_authenticated/admin")({ head: () => pageMeta("Admin — BEGIN UPSC", "Role-protected admin overview for content and users."), component: AdminHome });

function AdminHome() {
  const { isAdmin } = Route.useRouteContext();
  const counts = useQuery({ queryKey: ["admin-counts"], enabled: isAdmin, queryFn: async () => {
    const tables = ["profiles", "questions", "tests", "current_affairs", "syllabus_topics", "resources", "mains_questions"] as const;
    const pairs = await Promise.all(tables.map(async (table) => { const { count, error } = await supabase.from(table).select("id", { count: "exact", head: true }); if (error) throw error; return [table, count ?? 0] as const; }));
    return Object.fromEntries(pairs) as Record<(typeof tables)[number], number>;
  }});
  const links = [["Users", "/admin/users"], ["Questions", "/admin/questions"], ["Tests", "/admin/tests"], ["Current Affairs", "/admin/current-affairs"], ["Syllabus", "/admin/syllabus"], ["Resources", "/admin/resources"], ["Mains", "/admin/mains"]] as const;
  return <AdminGate isAdmin={isAdmin}><div className="space-y-6"><PageHeader title="Admin dashboard" description="Manage published learning content. Backend rules also prevent ordinary users from editing this data." /><div className="grid gap-5 md:grid-cols-3"><MetricCard label="Users" value={String(counts.data?.profiles ?? 0)} /><MetricCard label="Questions" value={String(counts.data?.questions ?? 0)} /><MetricCard label="Tests" value={String(counts.data?.tests ?? 0)} /><MetricCard label="Current affairs" value={String(counts.data?.current_affairs ?? 0)} /></div><Card className="border-border/70"><CardHeader><CardTitle>Admin sections</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2">{links.map(([label, to]) => <Button key={to} asChild variant="outline"><Link to={to}>{label}</Link></Button>)}</CardContent></Card></div></AdminGate>;
}
