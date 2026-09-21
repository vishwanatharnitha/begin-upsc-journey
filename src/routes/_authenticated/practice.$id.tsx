import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
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
  const saveAttempt = useMutation({ mutationFn: async () => { const isCorrect = selected === question.correct_option; const { data: attempt, error } = await supabase.from("test_attempts").insert({ user_id: user.id, total_questions: 1, correct_answers: isCorrect ? 1 : 0, incorrect_answers: isCorrect ? 0 : 1, unanswered: selected ? 0 : 1, score: isCorrect ? 2 : 0, accuracy: isCorrect ? 100 : 0, completed_at: new Date().toISOString() }).select("id").single(); if (error) throw error; const attemptId = attempt?.id; if (!attemptId) throw new Error("Attempt was not saved"); const { error: answerError } = await supabase.from("test_answers").insert({ attempt_id: attemptId, question_id: question.id, selected_option: selected, is_correct: isCorrect }); if (answerError) throw answerError; }, onSuccess: () => { setSubmitted(true); toast.success("Answer submitted"); }, onError: () => toast.error("Could not save this attempt.") });
  const options = [["A", question.option_a], ["B", question.option_b], ["C", question.option_c], ["D", question.option_d]] as const;
  return <div className="space-y-6"><PageHeader title="Practice question" description="Select one answer, submit, then review the stored result and explanation." action={<BookmarkToggle userId={user.id} contentType="question" contentId={question.id} />} /><Card className="border-border/70"><CardHeader><CardTitle className="leading-7">{question.question_text}</CardTitle></CardHeader><CardContent className="space-y-3">{options.map(([key, text]) => <button key={key} type="button" onClick={() => !submitted && setSelected(key)} className={`w-full rounded-md border p-4 text-left text-sm transition-colors ${selected === key ? "border-primary bg-secondary" : "border-border hover:bg-secondary"}`}>{key}. {text}</button>)}<Button disabled={!selected || submitted || saveAttempt.isPending} onClick={() => saveAttempt.mutate()}>{submitted ? "Submitted" : "Submit answer"}</Button></CardContent></Card>{submitted ? <Card className="border-border/70"><CardHeader><CardTitle>{selected === question.correct_option ? "Correct" : "Review"}</CardTitle></CardHeader><CardContent className="space-y-2 text-sm leading-6"><p>Correct option: {question.correct_option}</p><p className="text-muted-foreground">{question.explanation}</p></CardContent></Card> : null}</div>;
}
