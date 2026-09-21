import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { pageMeta } from "@/lib/pageMeta";
import { AdminGate } from "@/components/AdminGate";
import { PageHeader } from "@/components/PageHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type AdminUserRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  target_year: number | null;
  preparation_stage: string | null;
  role: string;
};

export const Route = createFileRoute("/_authenticated/admin/users")({ head: () => pageMeta("Admin users — BEGIN UPSC", "Admin user overview with profile and role data."), component: AdminUsers });

function AdminUsers() {
  const { isAdmin } = Route.useRouteContext();
  const users = useQuery({ queryKey: ["admin-users"], enabled: isAdmin, queryFn: async () => {
    const [{ data: profiles, error: profileError }, { data: roles, error: roleError }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email, target_year, preparation_stage").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    if (profileError) throw profileError;
    if (roleError) throw roleError;
    const roleByUser = new Map((roles ?? []).map((role) => [role.user_id, role.role]));
    return (profiles ?? []).map((profile): AdminUserRow => ({ ...profile, role: roleByUser.get(profile.id) ?? "user" }));
  }});
  return <AdminGate isAdmin={isAdmin}><div className="space-y-6"><PageHeader title="Users" description="Profiles are read from the backend. Roles are stored separately from profile data." /><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Stage</TableHead><TableHead>Target</TableHead><TableHead>Role</TableHead></TableRow></TableHeader><TableBody>{users.data?.map((user) => <TableRow key={user.id}><TableCell>{user.full_name ?? "—"}</TableCell><TableCell>{user.email ?? "—"}</TableCell><TableCell>{user.preparation_stage ?? "—"}</TableCell><TableCell>{user.target_year ?? "—"}</TableCell><TableCell>{user.role}</TableCell></TableRow>)}</TableBody></Table></div></AdminGate>;
}
