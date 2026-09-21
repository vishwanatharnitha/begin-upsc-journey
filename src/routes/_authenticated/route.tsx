import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });

    const { data: roleRows } = await supabase.from("user_roles").select("role");
    const isAdmin = roleRows?.some((row) => row.role === "admin") ?? false;

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, onboarding_completed")
      .eq("id", data.user.id)
      .maybeSingle();

    if (!profile) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        email: data.user.email ?? null,
        full_name: (data.user.user_metadata?.["full_name"] as string | undefined) ?? null,
        avatar_url: (data.user.user_metadata?.["avatar_url"] as string | undefined) ?? null,
      });
      await supabase.from("user_roles").upsert({ user_id: data.user.id, role: "user" });
    }

    return { user: data.user, isAdmin, onboardingCompleted: profile?.onboarding_completed ?? false };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, isAdmin } = Route.useRouteContext();
  return <AppShell user={user} isAdmin={isAdmin} />;
}
