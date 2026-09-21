import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { pageMeta } from "@/lib/pageMeta";
import { todayKey } from "@/lib/upsc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/planner")({ head: () => pageMeta("Study planner — BEGIN UPSC", "Plan daily and weekly study tasks with statuses, durations and completion tracking."), component: PlannerPage });

function PlannerPage() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayKey());
  const [duration, setDuration] = useState("60");
  const [priority, setPriority] = useState("medium");
  const tasks = useQuery({ queryKey: ["study_tasks"], queryFn: async () => { const { data, error } = await supabase.from("study_tasks").select("id, title, task_date, duration_minutes, status, priority").order("task_date", { ascending: true }); if (error) throw error; return data ?? []; }});
  const add = useMutation({ mutationFn: async () => { const { error } = await supabase.from("study_tasks").insert({ user_id: user.id, title: title.trim(), task_date: date, duration_minutes: Number(duration) || 60, priority }); if (error) throw error; }, onSuccess: () => { setTitle(""); toast.success("Task added"); queryClient.invalidateQueries({ queryKey: ["study_tasks"] }); }, onError: () => toast.error("Could not add task.") });
  const update = useMutation({ mutationFn: async ({ id, status }: { id: string; status: string }) => { const { error } = await supabase.from("study_tasks").update({ status, completed_at: status === "completed" ? new Date().toISOString() : null }).eq("id", id); if (error) throw error; }, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["study_tasks"] }), onError: () => toast.error("Could not update task.") });
  const remove = useMutation({ mutationFn: async (id: string) => { const { error } = await supabase.from("study_tasks").delete().eq("id", id); if (error) throw error; }, onSuccess: () => { toast.success("Task deleted"); queryClient.invalidateQueries({ queryKey: ["study_tasks"] }); }, onError: () => toast.error("Could not delete task.") });
  const completed = tasks.data?.filter((task) => task.status === "completed").length ?? 0;
  return <div className="space-y-6"><PageHeader title="Study planner" description={`Completed tasks saved here drive streaks and planner analytics. Completed so far: ${completed}.`} /><div className="grid gap-6 lg:grid-cols-[360px_1fr]"><Card className="border-border/70"><CardHeader><CardTitle>New task</CardTitle></CardHeader><CardContent><form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (title.trim()) add.mutate(); }}><div className="space-y-2"><Label>Task</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Revise polity chapter" /></div><div className="space-y-2"><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div><div className="grid gap-3 sm:grid-cols-2"><div className="space-y-2"><Label>Minutes</Label><Input type="number" min={15} value={duration} onChange={(e) => setDuration(e.target.value)} /></div><div className="space-y-2"><Label>Priority</Label><Select value={priority} onValueChange={setPriority}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem></SelectContent></Select></div></div><Button type="submit">Add task</Button></form></CardContent></Card><div className="space-y-3">{tasks.data?.map((task) => <Card key={task.id} className="border-border/70"><CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6"><div><p className="font-medium">{task.title}</p><p className="text-sm text-muted-foreground">{task.task_date} · {task.duration_minutes} min · {task.priority}</p></div><div className="flex flex-wrap gap-2"><Select value={task.status} onValueChange={(status) => update.mutate({ id: task.id, status })}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="in_progress">In progress</SelectItem><SelectItem value="completed">Completed</SelectItem></SelectContent></Select><Button variant="outline" size="sm" onClick={() => remove.mutate(task.id)}>Delete</Button></div></CardContent></Card>)}{tasks.data?.length === 0 ? <p className="text-sm text-muted-foreground">No tasks yet.</p> : null}</div></div></div>;
}
