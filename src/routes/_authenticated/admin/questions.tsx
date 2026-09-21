import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { pageMeta } from "@/lib/pageMeta";
import { AdminGate } from "@/components/AdminGate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/PageHeader";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/admin/questions")({ head: () => pageMeta("Admin questions — BEGIN UPSC", "Create, publish, unpublish and delete practice questions."), component: AdminQuestions });

function AdminQuestions() {
  const { isAdmin } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correct, setCorrect] = useState("A");
  const [explanation, setExplanation] = useState("");
  const questions = useQuery({ queryKey: ["admin-questions"], enabled: isAdmin, queryFn: async () => { const { data, error } = await supabase.from("questions").select("id, question_text, difficulty, published").order("created_at", { ascending: false }); if (error) throw error; return data ?? []; }});
  const add = useMutation({ mutationFn: async () => { const { error } = await supabase.from("questions").insert({ question_text: text, option_a: options[0] ?? "", option_b: options[1] ?? "", option_c: options[2] ?? "", option_d: options[3] ?? "", correct_option: correct, explanation, published: true }); if (error) throw error; }, onSuccess: () => { setText(""); setOptions(["", "", "", ""]); setExplanation(""); toast.success("Question added"); queryClient.invalidateQueries({ queryKey: ["admin-questions"] }); }, onError: () => toast.error("Could not save question.") });
  const patch = useMutation({ mutationFn: async ({ id, published }: { id: string; published: boolean }) => { const { error } = await supabase.from("questions").update({ published }).eq("id", id); if (error) throw error; }, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-questions"] }) });
  return <AdminGate isAdmin={isAdmin}><div className="space-y-6"><PageHeader title="Question admin" description="Create and publish MCQs. Ordinary learners can only read published questions and save their own attempts." /><Card className="border-border/70"><CardHeader><CardTitle>New question</CardTitle></CardHeader><CardContent><form className="space-y-4" onSubmit={(e) => { e.preventDefault(); add.mutate(); }}><Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Question text" required />{options.map((option, index) => <Input key={index} value={option} onChange={(e) => setOptions((current) => current.map((item, i) => i === index ? e.target.value : item))} placeholder={`Option ${String.fromCharCode(65 + index)}`} required />)}<div className="space-y-2"><Label>Correct option</Label><Input value={correct} onChange={(e) => setCorrect(e.target.value.toUpperCase().slice(0, 1))} /></div><Textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} placeholder="Explanation" required /><Button type="submit">Save question</Button></form></CardContent></Card><div className="space-y-3">{questions.data?.map((question) => <Card key={question.id} className="border-border/70"><CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6"><p className="max-w-2xl text-sm font-medium">{question.question_text}</p><Button variant="outline" size="sm" onClick={() => patch.mutate({ id: question.id, published: !question.published })}>{question.published ? "Unpublish" : "Publish"}</Button></CardContent></Card>)}</div></div></AdminGate>;
}
