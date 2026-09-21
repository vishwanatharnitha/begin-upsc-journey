import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { askAiAssistant } from "@/lib/ai.functions";
import { pageMeta } from "@/lib/pageMeta";
import { words } from "@/lib/upsc";
import { BookmarkToggle } from "@/components/BookmarkToggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/mains/$id")({ loader: async ({ params }) => { const { data, error } = await supabase.from("mains_questions").select("id, question_text, paper, difficulty, word_limit, marks, evaluation_criteria").eq("id", params.id).eq("published", true).maybeSingle(); if (error) throw error; if (!data) throw notFound(); return data; }, head: () => pageMeta("Write Mains answer — BEGIN UPSC", "Save Mains drafts, submissions and request AI-assisted feedback."), component: MainsDetail });

function MainsDetail() {
  const question = Route.useLoaderData();
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const askAi = useServerFn(askAiAssistant);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState(Date.now());
  const count = words(answer);
  const history = useQuery({ queryKey: ["mains_submissions", question.id], queryFn: async () => { const { data, error } = await supabase.from("mains_submissions").select("id, answer_text, word_count, status, ai_feedback, submitted_at, updated_at").eq("question_id", question.id).order("updated_at", { ascending: false }); if (error) throw error; return data ?? []; }});

  useEffect(() => {
    const draft = history.data?.find((item) => item.status === "draft");
    if (!draft || answer || editingId) return;
    setAnswer(draft.answer_text);
    setEditingId(draft.id);
  }, [history.data, answer, editingId]);

  const save = useMutation({ mutationFn: async (status: "draft" | "submitted") => { const seconds = Math.max(0, Math.round((Date.now() - startedAt) / 1000)); const payload = { user_id: user.id, question_id: question.id, answer_text: answer, word_count: count, time_spent: seconds, status, ai_feedback: feedback ? { label: "AI-assisted", text: feedback } : null, submitted_at: new Date().toISOString() }; if (editingId) { const { error } = await supabase.from("mains_submissions").update(payload).eq("id", editingId); if (error) throw error; return editingId; } const { data, error } = await supabase.from("mains_submissions").insert(payload).select("id").single(); if (error) throw error; return data.id; }, onSuccess: (id, status) => { setEditingId(id); setStartedAt(Date.now()); toast.success(status === "draft" ? "Draft saved" : "Answer submitted"); queryClient.invalidateQueries({ queryKey: ["mains_submissions", question.id] }); queryClient.invalidateQueries({ queryKey: ["mains_submissions"] }); }, onError: () => toast.error("Could not save answer.") });
  async function requestFeedback() { if (!answer.trim()) return; try { const result = await askAi({ data: { mode: "mains", prompt: `Question: ${question.question_text}\nAnswer: ${answer}` } }); setFeedback(`${result.disclaimer}\n\n${result.answer}`); } catch { toast.error("AI feedback is unavailable right now."); } }
  function loadSubmission(item: { id: string; answer_text: string; ai_feedback: unknown }) { setEditingId(item.id); setAnswer(item.answer_text); if (item.ai_feedback && typeof item.ai_feedback === "object" && "text" in item.ai_feedback) setFeedback(String(item.ai_feedback.text)); else setFeedback(null); setStartedAt(Date.now()); }
  return <div className="space-y-6"><PageHeader title="Mains answer" description={question.question_text} action={<BookmarkToggle userId={user.id} contentType="mains_question" contentId={question.id} />} /><Card className="border-border/70"><CardHeader><CardTitle>{question.paper} · {question.marks} marks · {question.word_limit} words</CardTitle></CardHeader><CardContent className="space-y-4"><Textarea rows={14} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Write your answer with intro, body and conclusion…" /><div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground"><span>{count}/{question.word_limit} words</span><Button onClick={() => save.mutate("draft")} disabled={!answer.trim() || save.isPending}>Save draft</Button><Button onClick={() => save.mutate("submitted")} disabled={!answer.trim() || save.isPending}>Submit answer</Button><Button variant="outline" onClick={requestFeedback} disabled={!answer.trim()}>AI-assisted feedback</Button></div></CardContent></Card>{feedback ? <Card className="border-border/70"><CardHeader><CardTitle>AI-assisted feedback</CardTitle></CardHeader><CardContent className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{feedback}</CardContent></Card> : null}<Card className="border-border/70"><CardHeader><CardTitle>Answer history</CardTitle></CardHeader><CardContent className="space-y-3">{history.data?.map((item) => <div key={item.id} className="rounded-md border border-border/70 p-3"><div className="flex flex-wrap items-center justify-between gap-3"><div><Badge variant={item.status === "draft" ? "outline" : "default"}>{item.status}</Badge><p className="mt-2 text-sm text-muted-foreground">{item.word_count} words · {new Date(item.updated_at).toLocaleString()}</p></div><Button variant="outline" size="sm" onClick={() => loadSubmission(item)}>Open</Button></div><p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{item.answer_text}</p></div>)}{!history.data?.length ? <p className="text-sm text-muted-foreground">No saved answer yet.</p> : null}</CardContent></Card></div>;
}
