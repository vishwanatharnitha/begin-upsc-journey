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

type QuestionRow = { id: string; question_text: string; option_a: string; option_b: string; option_c: string; option_d: string; correct_option: string; explanation: string; difficulty: string; question_type: string; published: boolean };

export const Route = createFileRoute("/_authenticated/admin/questions")({ head: () => pageMeta("Admin questions — BEGIN UPSC", "Create, edit, publish, unpublish and delete practice questions."), component: AdminQuestions });

function AdminQuestions() {
  const { isAdmin } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correct, setCorrect] = useState("A");
  const [difficulty, setDifficulty] = useState("medium");
  const [questionType, setQuestionType] = useState("practice");
  const [published, setPublished] = useState(false);
  const [explanation, setExplanation] = useState("");
  const questions = useQuery({ queryKey: ["admin-questions"], enabled: isAdmin, queryFn: async () => { const { data, error } = await supabase.from("questions").select("id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, difficulty, question_type, published").order("created_at", { ascending: false }).limit(120); if (error) throw error; return (data ?? []) as QuestionRow[]; }});
  function resetForm() { setEditingId(null); setText(""); setOptions(["", "", "", ""]); setCorrect("A"); setDifficulty("medium"); setQuestionType("practice"); setPublished(false); setExplanation(""); }
  function edit(question: QuestionRow) { setEditingId(question.id); setText(question.question_text); setOptions([question.option_a, question.option_b, question.option_c, question.option_d]); setCorrect(question.correct_option); setDifficulty(question.difficulty); setQuestionType(question.question_type); setPublished(question.published); setExplanation(question.explanation); }
  const save = useMutation({ mutationFn: async () => { const payload = { question_text: text.trim(), option_a: options[0] ?? "", option_b: options[1] ?? "", option_c: options[2] ?? "", option_d: options[3] ?? "", correct_option: correct, explanation: explanation.trim(), difficulty, question_type: questionType, published }; const response = editingId ? await supabase.from("questions").update(payload).eq("id", editingId) : await supabase.from("questions").insert(payload); if (response.error) throw response.error; }, onSuccess: () => { resetForm(); toast.success("Question saved"); queryClient.invalidateQueries({ queryKey: ["admin-questions"] }); }, onError: () => toast.error("Could not save question.") });
  const patch = useMutation({ mutationFn: async ({ id, published: next }: { id: string; published: boolean }) => { const { error } = await supabase.from("questions").update({ published: next }).eq("id", id); if (error) throw error; }, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-questions"] }), onError: () => toast.error("Could not update question.") });
  const remove = useMutation({ mutationFn: async (id: string) => { const { error } = await supabase.from("questions").delete().eq("id", id); if (error) throw error; }, onSuccess: () => { toast.success("Question deleted"); queryClient.invalidateQueries({ queryKey: ["admin-questions"] }); }, onError: () => toast.error("Could not delete question. It may have saved attempts.") });
  return <AdminGate isAdmin={isAdmin}><div className="space-y-6"><PageHeader title="Question admin" description="Create and manage MCQs. Ordinary learners can only read published questions and save their own attempts." /><Card className="border-border/70"><CardHeader><CardTitle>{editingId ? "Edit question" : "New question"}</CardTitle></CardHeader><CardContent><form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}><Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Question text" required />{options.map((option, index) => <Input key={index} value={option} onChange={(e) => setOptions((current) => current.map((item, i) => i === index ? e.target.value : item))} placeholder={`Option ${String.fromCharCode(65 + index)}`} required />)}<div className="grid gap-3 md:grid-cols-3"><div className="space-y-2"><Label>Correct option</Label><Select value={correct} onValueChange={setCorrect}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["A", "B", "C", "D"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Difficulty</Label><Select value={difficulty} onValueChange={setDifficulty}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="easy">Easy</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="hard">Hard</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Question type</Label><Input value={questionType} onChange={(e) => setQuestionType(e.target.value)} /></div></div><Textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} placeholder="Explanation" required /><label className="flex items-center gap-2 text-sm"><Checkbox checked={published} onCheckedChange={(checked) => setPublished(Boolean(checked))} /> Publish now</label><div className="flex gap-2"><Button type="submit" disabled={save.isPending}>{editingId ? "Update question" : "Save question"}</Button>{editingId ? <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button> : null}</div></form></CardContent></Card><div className="space-y-3">{questions.data?.map((question) => <Card key={question.id} className="border-border/70"><CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6"><p className="max-w-2xl text-sm font-medium">{question.question_text}</p><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => edit(question)}>Edit</Button><Button variant="outline" size="sm" onClick={() => patch.mutate({ id: question.id, published: !question.published })}>{question.published ? "Unpublish" : "Publish"}</Button><Button variant="destructive" size="sm" onClick={() => remove.mutate(question.id)}>Delete</Button></div></CardContent></Card>)}</div></div></AdminGate>;
}
