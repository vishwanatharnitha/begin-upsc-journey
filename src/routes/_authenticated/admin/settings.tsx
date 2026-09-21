import { createFileRoute } from "@tanstack/react-router";
import { pageMeta } from "@/lib/pageMeta";
import { AdminGate } from "@/components/AdminGate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/_authenticated/admin/settings")({ head: () => pageMeta("Admin settings — BEGIN UPSC", "Admin notes for secure content operations."), component: AdminSettings });

function AdminSettings() {
  const { isAdmin } = Route.useRouteContext();
  return <AdminGate isAdmin={isAdmin}><div className="space-y-6"><PageHeader title="Admin settings" description="Operational guardrails for BEGIN UPSC content management." /><Card className="border-border/70"><CardHeader><CardTitle>Security model</CardTitle></CardHeader><CardContent className="space-y-3 text-sm leading-6 text-muted-foreground"><p>Admin rights are checked by backend policies, not only by this screen.</p><p>Users can read published learning content and manage only their own progress, attempts, notes, tasks and bookmarks.</p><p>AI-assisted text must remain labelled and must not be presented as official UPSC evaluation.</p></CardContent></Card></div></AdminGate>;
}
