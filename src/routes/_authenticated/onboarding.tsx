import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PREPARATION_STAGES } from "@/lib/upsc";
import { pageMeta } from "@/lib/pageMeta";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => pageMeta("Onboarding — BEGIN UPSC", "Set target year, stage, focus areas and daily study goal."),
  component: OnboardingPage,
});

const areas = ["Polity", "Economy", "History", "Geography", "Environment", "Science", "Ethics", "Essay"];

function OnboardingPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const [targetYear, setTargetYear] = useState(String(new Date().getFullYear() + 1));
  const [stage, setStage] = useState("Foundation");
  const [goal, setGoal] = useState("120");
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      email: user.email ?? null,
      full_name: (user.user_metadata?.["full_name"] as string | undefined) ?? null,
      target_year: Number(targetYear),
      preparation_stage: stage,
      preferred_areas: selected,
      daily_goal_minutes: Math.max(15, Number(goal) || 120),
      onboarding_completed: true,
    });
    setBusy(false);
    if (error) {
      toast.error("Could not save onboarding. Please try again.");
      return;
    }
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Set your preparation baseline</h1>
        <p className="mt-2 text-sm text-muted-foreground">These values personalize goals and analytics. You can change them later.</p>
      </div>
      <Card className="border-border/70">
        <CardHeader><CardTitle>Preparation profile</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="target-year">Target year</Label><Input id="target-year" type="number" value={targetYear} onChange={(e) => setTargetYear(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="goal">Daily goal in minutes</Label><Input id="goal" type="number" min={15} value={goal} onChange={(e) => setGoal(e.target.value)} /></div>
          </div>
          <div className="space-y-2">
            <Label>Preparation stage</Label>
            <Select value={stage} onValueChange={setStage}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PREPARATION_STAGES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
          </div>
          <div className="space-y-3">
            <Label>Preferred areas</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              {areas.map((area) => (
                <label key={area} className="flex items-center gap-2 rounded-md border border-border/70 p-3 text-sm">
                  <Checkbox checked={selected.includes(area)} onCheckedChange={(checked) => setSelected((current) => checked ? [...current, area] : current.filter((item) => item !== area))} />
                  {area}
                </label>
              ))}
            </div>
          </div>
          <Button onClick={save} disabled={busy}>{busy ? "Saving…" : "Finish setup"}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
