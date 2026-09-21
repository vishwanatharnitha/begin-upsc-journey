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

export const Route = createFileRoute("/_authenticated/admin/tests")({ head: () => pageMeta("Admin tests — BEGIN UPSC", "Create, edit, publish and delete test papers."), component: AdminTests });

type TestRow = { id: string; title: string; description: string | null; test_type: string; subject_id: string | null; duration_minutes: number; total_questions: number; published: boolean };
type QuestionRow = { id: string; question_text: string; published: boolean };

function AdminTests() {
  const { isAdmin } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [testType, setTestType] = useState("mock");
  const [subjectId, setSubjectId] = useState("none");
  const [duration, setDuration] = useState("60");
  const [published, setPublished] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);

  const tests = useQuery({ queryKey: ["admin-tests"], enabled: isAdmin, queryFn: async () => { const { data, error } = await supabase.from("tests").select("id, title, description, test_type, subject_id, duration_minutes, total_questions, published").order("created_at", { ascending: false }).limit(120); if (error) throw error; return (data ?? []) as TestRow[]; }});
  const subjects = useQuery({ queryKey: ["admin-test-subjects"], enabled: isAdmin, queryFn: async () => { const { data, error } = await supabase.from("subjects").select("id, name").order("display_order"); if (error) throw error; return data ?? []; }});
  const questions = useQuery({ queryKey: ["admin-test-question-options"], enabled: isAdmin, queryFn: async () => { const { data, error } = await supabase.from("questions").select("id, question_text, published").order("created_at", { ascending: false }).limit(200); if (error) throw error; return (data ?? []) as QuestionRow[]; }});
  const assigned = useQuery({ queryKey: ["admin-test-questions"], enabled: isAdmin, queryFn: async () => { const { data, error } = await supabase.from("test_questions").select("test_id, question_id, display_order").order("display_order"); if (error) throw error; return data ?? []; }});

  function resetForm() { setEditingId(null); setTitle(""); setDescription(""); setTestType("mock"); setSubjectId("none"); setDuration("60"); setPublished(false); setSelectedQuestions([]); }
  function edit(test: TestRow) { setEditingId(test.id); setTitle(test.title); setDescription(test.description ?? ""); setTestType(test.test_type); setSubjectId(test.subject_id ?? "none"); setDuration(String(test.duration_minutes)); setPublished(test.published); setSelectedQuestions((assigned.data ?? []).filter((row) => row.test_id === test.id).map((row) => row.question_id)); }
  function toggleQuestion(questionId: string, checked: boolean) { setSelectedQuestions((current) => checked ? [...new Set([...current, questionId])] : current.filter((id) => id !== questionId)); }

  const save = useMutation({ mutationFn: async () => {
    if (!selectedQuestions.length) throw new Error("Select at least one question");
    const payload = { title: title.trim(), description: description.trim() || null, test_type: testType.trim() || "mock", subject_id: subjectId === "none" ? null : subjectId, duration_minutes: Number(duration) || 60, total_questions: selectedQuestions.length, published };
    const response = editingId ? await supabase.from("tests").update(payload).eq("id", editingId).select("id").single() : await supabase.from("tests").insert(payload).select("id").single();
    if (response.error) throw response.error;
    const testId = response.data.id;
    const deleted = await supabase.from("test_questions").delete().eq("test_id", testId);
    if (deleted.error) throw deleted.error;
    const rows = selectedQuestions.map((questionId, index) => ({ test_id: testId, question_id: questionId, display_order: index + 1 }));
    const inserted = await supabase.from("test_questions").insert(rows);
    if (inserted.error) throw inserted.error;
  }, onSuccess: () => { resetForm(); toast.success("Test saved"); queryClient.invalidateQueries({ queryKey: ["admin-tests"] }); queryClient.invalidateQueries({ queryKey: ["admin-test-questions"] }); }, onError: (error) => toast.error(error instanceof Error ? error.message : "Could not save test.") });
  const patch = useMutation({ mutationFn: async ({ id, published: next }: { id: string; published: boolean }) => { const { error } = await supabase.from("tests").update({ published: next }).eq("id", id); if (error) throw error; }, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-tests"] }), onError: () => toast.error("Could not update test.") });
  const remove = useMutation({ mutationFn: async (id: string) => { const questionsDelete = await supabase.from("test_questions").delete().eq("test_id", id); if (questionsDelete.error) throw questionsDelete.error; const { error } = await supabase.from("tests").delete().eq("id", id); if (error) throw error; }, onSuccess: () => { toast.success("Test deleted"); queryClient.invalidateQueries({ queryKey: ["admin-tests"] }); queryClient.invalidateQueries({ queryKey: ["admin-test-questions"] }); }, onError: () => toast.error("Could not delete test. It may have saved attempts.") });

  return <AdminGate isAdmin={isAdmin}><div className="space-y-6"><PageHeader title="Test admin" description="Build timed tests from the question bank. Tests stay hidden until published." /><Card className="border-border/70"><CardHeader><CardTitle>{editingId ? "Edit test" : "New test"}</CardTitle></CardHeader><CardContent><form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}><div className="grid gap-3 md:grid-cols-2"><div className="space-y-2"><Label htmlFor="test-title">Title</Label><Input id="test-title" value={title} onChange={(e) => setTitle(e.target.value)} required /></div><div className="space-y-2"><Label htmlFor="test-type">Type</Label><Input id="test-type" value={testType} onChange={(e) => setTestType(e.target.value)} /></div></div><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" /><div className="grid gap-3 md:grid-cols-2"><div className="space-y-2"><Label>Subject</Label><Select value={subjectId} onValueChange={setSubjectId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Mixed subjects</SelectItem>{subjects.data?.map((subject) => <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label htmlFor="duration">Duration minutes</Label><Input id="duration" type="number" min={1} value={duration} onChange={(e) => setDuration(e.target.value)} /></div></div><label className="flex items-center gap-2 text-sm"><Checkbox checked={published} onCheckedChange={(checked) => setPublished(Boolean(checked))} /> Publish now</label><div className="space-y-2"><Label>Questions ({selectedQuestions.length})</Label><div className="max-h-80 space-y-2 overflow-y-auto rounded-md border border-border/70 p-3">{questions.data?.map((question) => <label key={question.id} className="flex items-start gap-2 rounded-md p-2 text-sm hover:bg-secondary"><Checkbox checked={selectedQuestions.includes(question.id)} onCheckedChange={(checked) => toggleQuestion(question.id, Boolean(checked))} /><span><span className="font-medium">{question.question_text}</span>{question.published ? null : <span className="ml-2 text-xs text-muted-foreground">draft</span>}</span></label>)}</div></div><div className="flex gap-2"><Button type="submit" disabled={save.isPending}>{editingId ? "Update test" : "Save test"}</Button>{editingId ? <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button> : null}</div></form></CardContent></Card><div className="space-y-3">{tests.data?.map((test) => <Card key={test.id} className="border-border/70"><CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6"><div><p className="font-medium">{test.title}</p><p className="text-sm text-muted-foreground">{test.test_type} · {test.duration_minutes} min · {test.total_questions} questions · {test.published ? "Published" : "Draft"}</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => edit(test)}>Edit</Button><Button variant="outline" size="sm" onClick={() => patch.mutate({ id: test.id, published: !test.published })}>{test.published ? "Unpublish" : "Publish"}</Button><Button variant="destructive" size="sm" onClick={() => remove.mutate(test.id)}>Delete</Button></div></CardContent></Card>)}</div></div></AdminGate>;
}
