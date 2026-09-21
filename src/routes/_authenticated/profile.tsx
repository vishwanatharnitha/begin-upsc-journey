import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PREPARATION_STAGES } from "@/lib/upsc";
import { pageMeta } from "@/lib/pageMeta";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/profile")({ head: () => pageMeta("Profile — BEGIN UPSC", "Manage your target attempt, study goal and preparation profile."), component: ProfilePage });

function ProfilePage() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const profile = useQuery({ queryKey: ["profile"], queryFn: async () => { const { data, error } = await supabase.from("profiles").select("full_name, target_attempt, target_year, preparation_stage, daily_goal_minutes, preferred_areas, optional_subject").eq("id", user.id).maybeSingle(); if (error) throw error; return data; }});
  const [name, setName] = useState("");
  const [attempt, setAttempt] = useState("");
  const [year, setYear] = useState("");
  const [stage, setStage] = useState("Foundation");
  const [goal, setGoal] = useState("120");
  const [areas, setAreas] = useState("");
  const [optionalSubject, setOptionalSubject] = useState("");
  useEffect(() => {
    if (!profile.data) return;
    setName(profile.data.full_name ?? "");
    setAttempt(profile.data.target_attempt ?? "");
    setYear(String(profile.data.target_year ?? ""));
    setStage(profile.data.preparation_stage ?? "Foundation");
    setGoal(String(profile.data.daily_goal_minutes ?? 120));
    setAreas((profile.data.preferred_areas ?? []).join(", "));
    setOptionalSubject(profile.data.optional_subject ?? "");
  }, [profile.data]);
  const save = useMutation({ mutationFn: async () => { const { error } = await supabase.from("profiles").update({ full_name: name.trim() || null, target_attempt: attempt.trim() || null, target_year: Number(year) || null, preparation_stage: stage, daily_goal_minutes: Number(goal) || 120, preferred_areas: areas.split(",").map((item) => item.trim()).filter(Boolean), optional_subject: optionalSubject.trim() || null, onboarding_completed: true }).eq("id", user.id); if (error) throw error; }, onSuccess: () => { toast.success("Profile updated"); queryClient.invalidateQueries({ queryKey: ["profile"] }); }, onError: () => toast.error("Could not update profile.") });
  return <div className="space-y-6"><PageHeader title="Profile" description="Update your preparation details and daily study target." /><Card className="max-w-2xl border-border/70"><CardHeader><CardTitle>Preparation details</CardTitle></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label>Full name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Target attempt</Label><Input value={attempt} onChange={(e) => setAttempt(e.target.value)} placeholder="e.g. First attempt" /></div><div className="space-y-2"><Label>Target year</Label><Input type="number" value={year} onChange={(e) => setYear(e.target.value)} /></div></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Daily goal minutes</Label><Input type="number" value={goal} onChange={(e) => setGoal(e.target.value)} /></div><div className="space-y-2"><Label>Optional subject</Label><Input value={optionalSubject} onChange={(e) => setOptionalSubject(e.target.value)} /></div></div><div className="space-y-2"><Label>Stage</Label><Select value={stage} onValueChange={setStage}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PREPARATION_STAGES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Preferred areas</Label><Input value={areas} onChange={(e) => setAreas(e.target.value)} placeholder="Polity, Economy, Environment" /></div><Button onClick={() => save.mutate()} disabled={save.isPending}>Save profile</Button></CardContent></Card></div>;
}
