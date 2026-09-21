import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { askAiAssistant } from "@/lib/ai.functions";
import { pageMeta } from "@/lib/pageMeta";
import { words } from "@/lib/upsc";
import { BookmarkToggle } from "@/components/BookmarkToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/mains/$id")({ loader: async ({ params }) => { const { data, error } = await supabase.from("mains_questions").select("id, question_text, paper, difficulty, word_limit, marks, evaluation_criteria").eq("id", params.id).eq("published", true).maybeSingle(); if (error) throw error; if (!data) throw notFound(); return data; }, head: () => pageMeta("Write Mains answer — BEGIN UPSC", "Save a Mains answer and request AI-assisted feedback."), component: MainsDetail });

function MainsDetail() {
  const question = Route.useLoaderData();
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const askAi = useServerFn(askAiAssistant);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const count = words(answer);
  const save = useMutation({ mutationFn: async (aiFeedback: string | null) => { const { error } = await supabase.from("mains_submissions").insert({ user_id: user.id, question_id: question.id, answer_text: answer, word_count: count, ai_feedback: aiFeedback ? { label: "AI-assisted", text: aiFeedback } : null }); if (error) throw error; }, onSuccess: () => { toast.success("Answer saved"); queryClient.invalidateQueries({ queryKey: ["mains_submissions"] }); }, onError: () => toast.error("Could not save answer.") });
  async function requestFeedback() { if (!answer.trim()) return; try { const result = await askAi({ data: { mode: "mains", prompt: `Question: ${question.question_text}\nAnswer: ${answer}` } }); setFeedback(`${result.disclaimer}\n\n${result.answer}`); } catch { toast.error("AI feedback is unavailable right now."); } }
  return <div className="space-y-6"><PageHeader title="Mains answer" description={question.question_text} action={<BookmarkToggle userId={user.id} contentType="mains_question" contentId={question.id} />} /><Card className="border-border/70"><CardHeader><CardTitle>{question.paper} · {question.marks} marks · {question.word_limit} words</CardTitle></CardHeader><CardContent className="space-y-4"><Textarea rows={14} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Write your answer with intro, body and conclusion…" /><div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground"><span>{count}/{question.word_limit} words</span><Button onClick={() => save.mutate(feedback)} disabled={!answer.trim() || save.isPending}>Save answer</Button><Button variant="outline" onClick={requestFeedback} disabled={!answer.trim()}>AI-assisted feedback</Button></div></CardContent></Card>{feedback ? <Card className="border-border/70"><CardHeader><CardTitle>AI-assisted feedback</CardTitle></CardHeader><CardContent className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{feedback}</CardContent></Card> : null}</div>;
}
