import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { pageMeta } from "@/lib/pageMeta";
import { AdminGate } from "@/components/AdminGate";
import { PageHeader } from "@/components/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type AdminUserRow = { id: string; full_name: string | null; email: string | null; target_year: number | null; preparation_stage: string | null; role: "admin" | "moderator" | "user" };

export const Route = createFileRoute("/_authenticated/admin/users")({ head: () => pageMeta("Admin users — BEGIN UPSC", "Admin user overview with profile and role controls."), component: AdminUsers });

function AdminUsers() {
  const { isAdmin, user: currentUser } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const users = useQuery({ queryKey: ["admin-users"], enabled: isAdmin, queryFn: async () => {
    const [{ data: profiles, error: profileError }, { data: roles, error: roleError }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email, target_year, preparation_stage").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    if (profileError) throw profileError;
    if (roleError) throw roleError;
    const roleByUser = new Map<string, "admin" | "moderator" | "user">();
    (roles ?? []).forEach((role) => {
      const existing = roleByUser.get(role.user_id);
      if (role.role === "admin" || (!existing && role.role === "moderator") || !existing) roleByUser.set(role.user_id, role.role as "admin" | "moderator" | "user");
    });
    return (profiles ?? []).map((profile): AdminUserRow => ({ ...profile, role: roleByUser.get(profile.id) ?? "user" }));
  }});
  const changeRole = useMutation({ mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "moderator" | "user" }) => { if (userId === currentUser.id && role !== "admin") throw new Error("You cannot remove your own admin access"); await supabase.from("user_roles").delete().eq("user_id", userId).in("role", ["admin", "moderator", "user"]); const { error } = await supabase.from("user_roles").insert({ user_id: userId, role }); if (error) throw error; }, onSuccess: () => { toast.success("Role updated"); queryClient.invalidateQueries({ queryKey: ["admin-users"] }); }, onError: (error) => toast.error(error instanceof Error ? error.message : "Could not update role.") });
  return <AdminGate isAdmin={isAdmin}><div className="space-y-6"><PageHeader title="Users" description="Profiles are read from the backend. Roles are stored separately from profile data." /><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Stage</TableHead><TableHead>Target</TableHead><TableHead>Role</TableHead></TableRow></TableHeader><TableBody>{users.data?.map((user) => <TableRow key={user.id}><TableCell>{user.full_name ?? "—"}</TableCell><TableCell>{user.email ?? "—"}</TableCell><TableCell>{user.preparation_stage ?? "—"}</TableCell><TableCell>{user.target_year ?? "—"}</TableCell><TableCell><Select value={user.role} onValueChange={(role) => changeRole.mutate({ userId: user.id, role: role as "admin" | "moderator" | "user" })}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="user">User</SelectItem><SelectItem value="moderator">Moderator</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent></Select></TableCell></TableRow>)}</TableBody></Table></div></AdminGate>;
}
