import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Flag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { pageMeta } from "@/lib/pageMeta";
import { BookmarkToggle } from "@/components/BookmarkToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/_authenticated/practice/$id")({ loader: async ({ params }) => { const { data, error } = await supabase.from("questions").select("id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, difficulty, tags").eq("id", params.id).eq("published", true).maybeSingle(); if (error) throw error; if (!data) throw notFound(); return data; }, head: () => pageMeta("Practice question — BEGIN UPSC", "Answer a UPSC practice question and review the explanation."), component: PracticeQuestion });

function PracticeQuestion() {
  const question = Route.useLoaderData();
  const { user } = Route.useRouteContext();
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [marked, setMarked] = useState(false);
  const startedAt = useMemo(() => Date.now(), []);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (submitted) return;
    const interval = window.setInterval(() => setElapsed(Math.max(0, Math.round((Date.now() - startedAt) / 1000))), 1000);
    return () => window.clearInterval(interval);
  }, [startedAt, submitted]);

  const saveAttempt = useMutation({ mutationFn: async () => { const isCorrect = selected === question.correct_option; const unanswered = selected ? 0 : 1; const { data: attempt, error } = await supabase.from("test_attempts").insert({ user_id: user.id, total_questions: 1, correct_answers: isCorrect ? 1 : 0, incorrect_answers: selected && !isCorrect ? 1 : 0, unanswered, score: isCorrect ? 2 : 0, accuracy: isCorrect ? 100 : 0, time_spent: elapsed, completed_at: new Date().toISOString() }).select("id").single(); if (error) throw error; const attemptId = attempt?.id; if (!attemptId) throw new Error("Attempt was not saved"); const { error: answerError } = await supabase.from("test_answers").insert({ attempt_id: attemptId, question_id: question.id, selected_option: selected, is_correct: isCorrect, time_spent: elapsed, marked_for_review: marked }); if (answerError) throw answerError; }, onSuccess: () => { setSubmitted(true); toast.success("Answer submitted"); }, onError: () => toast.error("Could not save this attempt.") });
  const options = [["A", question.option_a], ["B", question.option_b], ["C", question.option_c], ["D", question.option_d]] as const;
  return <div className="space-y-6"><PageHeader title="Practice question" description={`Timer: ${elapsed}s · ${marked ? "Marked for review" : "Not marked"}`} action={<BookmarkToggle userId={user.id} contentType="question" contentId={question.id} />} /><Card className="border-border/70"><CardHeader><CardTitle className="leading-7">{question.question_text}</CardTitle></CardHeader><CardContent className="space-y-3">{options.map(([key, text]) => <Button key={key} type="button" variant={selected === key ? "secondary" : "outline"} disabled={submitted} onClick={() => setSelected(key)} className="h-auto w-full justify-start whitespace-normal py-4 text-left">{key}. {text}</Button>)}<div className="flex flex-wrap gap-2"><Button variant={marked ? "default" : "outline"} onClick={() => setMarked((value) => !value)} disabled={submitted}><Flag className="h-4 w-4" /> {marked ? "Marked" : "Mark for review"}</Button><Button disabled={submitted || saveAttempt.isPending} onClick={() => saveAttempt.mutate()}>{submitted ? "Submitted" : "Submit answer"}</Button></div></CardContent></Card>{submitted ? <Card className="border-border/70"><CardHeader><CardTitle>{selected === question.correct_option ? "Correct" : selected ? "Review" : "Unanswered"}</CardTitle></CardHeader><CardContent className="space-y-2 text-sm leading-6"><p>Correct option: {question.correct_option}</p><p>Your answer: {selected ?? "Unanswered"}</p><p className="text-muted-foreground">{question.explanation}</p></CardContent></Card> : null}</div>;
}
