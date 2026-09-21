import { Link, Outlet } from "@tanstack/react-router";
import type { User } from "@supabase/supabase-js";
import {
  BarChart3,
  BookMarked,
  BookOpen,
  Bot,
  CalendarCheck,
  FilePenLine,
  GraduationCap,
  Landmark,
  Library,
  Newspaper,
  NotebookText,
  Search,
  ShieldCheck,
  Target,
  UserRound,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";

const learnerNav = [
  { to: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { to: "/syllabus", label: "Syllabus", icon: Landmark },
  { to: "/subjects", label: "Subjects", icon: BookOpen },
  { to: "/current-affairs", label: "Current Affairs", icon: Newspaper },
  { to: "/practice", label: "Practice", icon: Target },
  { to: "/tests", label: "Tests", icon: GraduationCap },
  { to: "/mains", label: "Mains", icon: FilePenLine },
  { to: "/planner", label: "Planner", icon: CalendarCheck },
  { to: "/bookmarks", label: "Bookmarks", icon: BookMarked },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/resources", label: "Resources", icon: Library },
  { to: "/search", label: "Search", icon: Search },
  { to: "/ai-assistant", label: "AI Assistant", icon: Bot },
  { to: "/profile", label: "Profile", icon: UserRound },
] as const;

const adminNav = [
  { to: "/admin", label: "Admin", icon: ShieldCheck },
  { to: "/admin/users", label: "Users", icon: UserRound },
  { to: "/admin/questions", label: "Questions", icon: Target },
  { to: "/admin/current-affairs", label: "Affairs", icon: Newspaper },
  { to: "/admin/syllabus", label: "Syllabus", icon: Landmark },
  { to: "/admin/resources", label: "Resources", icon: Library },
  { to: "/admin/mains", label: "Mains", icon: NotebookText },
  { to: "/admin/settings", label: "Settings", icon: ShieldCheck },
] as const;

export function AppShell({ user, isAdmin }: { user: User | null; isAdmin: boolean }) {
  const nav = isAdmin ? [...learnerNav, ...adminNav] : learnerNav;
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader user={user} isAdmin={isAdmin} />
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:grid-cols-[220px_minmax(0,1fr)] lg:px-6">
        <aside className="md:sticky md:top-20 md:h-[calc(100vh-6rem)] md:overflow-y-auto">
          <nav className="flex gap-2 overflow-x-auto rounded-lg border border-border/70 bg-card/80 p-2 shadow-sm md:flex-col">
            {nav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex min-w-max items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground [&.active]:bg-primary [&.active]:text-primary-foreground"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="min-w-0 pb-12">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
