import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { pageMeta } from "@/lib/pageMeta";
import { AdminGate } from "@/components/AdminGate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type MainsRow = { id: string; question_text: string; paper: string; difficulty: string; marks: number; word_limit: number; evaluation_criteria: string[]; published: boolean };

export const Route = createFileRoute("/_authenticated/admin/mains")({ head: () => pageMeta("Admin Mains — BEGIN UPSC", "Create, edit, publish, unpublish and delete Mains answer-writing questions."), component: AdminMains });

function AdminMains() {
  const { isAdmin } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [paper, setPaper] = useState("GS Paper 2");
  const [difficulty, setDifficulty] = useState("medium");
  const [marks, setMarks] = useState("10");
  const [wordLimit, setWordLimit] = useState("150");
  const [criteria, setCriteria] = useState("");
  const [published, setPublished] = useState(false);
  const mains = useQuery({ queryKey: ["admin-mains"], enabled: isAdmin, queryFn: async () => { const { data, error } = await supabase.from("mains_questions").select("id, question_text, paper, difficulty, marks, word_limit, evaluation_criteria, published").order("created_at", { ascending: false }).limit(120); if (error) throw error; return (data ?? []) as MainsRow[]; }});
  function resetForm() { setEditingId(null); setQuestion(""); setPaper("GS Paper 2"); setDifficulty("medium"); setMarks("10"); setWordLimit("150"); setCriteria(""); setPublished(false); }
  function edit(item: MainsRow) { setEditingId(item.id); setQuestion(item.question_text); setPaper(item.paper); setDifficulty(item.difficulty); setMarks(String(item.marks)); setWordLimit(String(item.word_limit)); setCriteria(item.evaluation_criteria.join("\n")); setPublished(item.published); }
  const save = useMutation({ mutationFn: async () => { const payload = { question_text: question.trim(), paper: paper.trim() || "GS Paper", difficulty, marks: Number(marks) || 10, word_limit: Number(wordLimit) || 150, evaluation_criteria: criteria.split("\n").map((item) => item.trim()).filter(Boolean), published }; const response = editingId ? await supabase.from("mains_questions").update(payload).eq("id", editingId) : await supabase.from("mains_questions").insert(payload); if (response.error) throw response.error; }, onSuccess: () => { resetForm(); toast.success("Mains question saved"); queryClient.invalidateQueries({ queryKey: ["admin-mains"] }); queryClient.invalidateQueries({ queryKey: ["mains_questions"] }); }, onError: () => toast.error("Could not save Mains question.") });
  const patch = useMutation({ mutationFn: async ({ id, published: next }: { id: string; published: boolean }) => { const { error } = await supabase.from("mains_questions").update({ published: next }).eq("id", id); if (error) throw error; }, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-mains"] }), onError: () => toast.error("Could not update Mains question.") });
  const remove = useMutation({ mutationFn: async (id: string) => { const { error } = await supabase.from("mains_questions").delete().eq("id", id); if (error) throw error; }, onSuccess: () => { toast.success("Mains question deleted"); queryClient.invalidateQueries({ queryKey: ["admin-mains"] }); }, onError: () => toast.error("Could not delete question. It may have learner submissions.") });
  return <AdminGate isAdmin={isAdmin}><div className="space-y-6"><PageHeader title="Mains admin" description="Manage answer-writing prompts. Learner submissions remain separate and user-owned." /><Card className="border-border/70"><CardHeader><CardTitle>{editingId ? "Edit Mains question" : "New Mains question"}</CardTitle></CardHeader><CardContent><form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}><Textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Question text" required /><div className="grid gap-3 md:grid-cols-4"><Input value={paper} onChange={(e) => setPaper(e.target.value)} placeholder="Paper" /><Select value={difficulty} onValueChange={setDifficulty}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="easy">Easy</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="hard">Hard</SelectItem></SelectContent></Select><Input type="number" value={marks} onChange={(e) => setMarks(e.target.value)} placeholder="Marks" /><Input type="number" value={wordLimit} onChange={(e) => setWordLimit(e.target.value)} placeholder="Word limit" /></div><Textarea value={criteria} onChange={(e) => setCriteria(e.target.value)} placeholder="Evaluation criteria, one per line" /><Label className="flex items-center gap-2"><Checkbox checked={published} onCheckedChange={(checked) => setPublished(Boolean(checked))} /> Publish now</Label><div className="flex gap-2"><Button type="submit" disabled={save.isPending}>{editingId ? "Update question" : "Save question"}</Button>{editingId ? <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button> : null}</div></form></CardContent></Card><div className="space-y-3">{mains.data?.map((item) => <Card key={item.id} className="border-border/70"><CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6"><div><p className="font-medium">{item.question_text}</p><p className="text-sm text-muted-foreground">{item.paper} · {item.word_limit} words · {item.published ? "Published" : "Draft"}</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => edit(item)}>Edit</Button><Button variant="outline" size="sm" onClick={() => patch.mutate({ id: item.id, published: !item.published })}>{item.published ? "Unpublish" : "Publish"}</Button><Button variant="destructive" size="sm" onClick={() => remove.mutate(item.id)}>Delete</Button></div></CardContent></Card>)}</div></div></AdminGate>;
}
