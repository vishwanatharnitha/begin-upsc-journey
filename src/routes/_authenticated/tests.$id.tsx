import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Flag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { pageMeta } from "@/lib/pageMeta";
import { formatMinutes } from "@/lib/upsc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/_authenticated/tests/$id")({ head: () => pageMeta("Take test — BEGIN UPSC", "Timed UPSC test interface with saved answers and result analysis."), component: TestPage });

type TestQuestion = { question_id: string; questions: { id: string; question_text: string; option_a: string; option_b: string; option_c: string; option_d: string; correct_option: string; explanation: string } | null };

function TestPage() {
  const { id } = Route.useParams();
  const { user } = Route.useRouteContext();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [marked, setMarked] = useState<Record<string, boolean>>({});
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const startedAt = useMemo(() => Date.now(), []);
  const test = useQuery({ queryKey: ["test", id], queryFn: async () => { const { data, error } = await supabase.from("tests").select("id, title, description, duration_minutes, total_questions").eq("id", id).eq("published", true).maybeSingle(); if (error) throw error; return data; }});
  const [timeLeft, setTimeLeft] = useState(0);
  const questions = useQuery({ queryKey: ["test_questions", id], queryFn: async () => { const { data, error } = await supabase.from("test_questions").select("question_id, questions(id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)").eq("test_id", id).order("display_order"); if (error) throw error; return (data ?? []) as TestQuestion[]; }});
  const q = (questions.data ?? []).map((row) => row.questions).filter((item): item is NonNullable<TestQuestion["questions"]> => Boolean(item));

  const submit = useMutation({ mutationFn: async () => { const spent = Math.max(0, Math.round((Date.now() - startedAt) / 1000)); const correct = q.filter((item) => answers[item.id] === item.correct_option).length; const unanswered = q.filter((item) => !answers[item.id]).length; const incorrect = q.length - correct - unanswered; const accuracy = q.length ? Math.round((correct / q.length) * 100) : 0; const { data: attempt, error } = await supabase.from("test_attempts").insert({ user_id: user.id, test_id: id, total_questions: q.length, correct_answers: correct, incorrect_answers: incorrect, unanswered, score: correct * 2, accuracy, time_spent: spent, completed_at: new Date().toISOString() }).select("id").single(); if (error) throw error; const savedAttemptId = attempt?.id; if (!savedAttemptId) throw new Error("Attempt was not saved"); const rows = q.map((item) => ({ attempt_id: savedAttemptId, question_id: item.id, selected_option: answers[item.id] ?? null, is_correct: answers[item.id] === item.correct_option, time_spent: spent, marked_for_review: marked[item.id] ?? false })); if (rows.length) { const { error: answerError } = await supabase.from("test_answers").insert(rows); if (answerError) throw answerError; } return savedAttemptId; }, onSuccess: (savedAttemptId) => { setAttemptId(savedAttemptId); toast.success("Test submitted"); }, onError: () => toast.error("Could not submit test.") });

  useEffect(() => {
    if (!test.data || attemptId) return;
    setTimeLeft(test.data.duration_minutes * 60);
  }, [test.data, attemptId]);

  useEffect(() => {
    if (!test.data || attemptId || submit.isPending) return;
    const interval = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          if (!attemptId && !submit.isPending) submit.mutate();
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [test.data, attemptId, submit]);

  if (!test.data) return <p className="text-sm text-muted-foreground">Loading test…</p>;
  return <div className="space-y-6"><PageHeader title={test.data.title} description={`${test.data.description ?? "Answer every question you can, then submit for analysis."} Time left: ${formatMinutes(Math.floor(timeLeft / 60))} ${timeLeft % 60}s`} action={attemptId ? <Button asChild><Link to="/tests/$id/result" params={{ id: attemptId }}>View result</Link></Button> : null} /><div className="space-y-5">{q.map((question, index) => <Card key={question.id} className="border-border/70"><CardHeader><CardTitle className="text-lg leading-7">{index + 1}. {question.question_text}</CardTitle></CardHeader><CardContent className="grid gap-3">{(["A", "B", "C", "D"] as const).map((key) => { const text = question[`option_${key.toLowerCase()}` as "option_a" | "option_b" | "option_c" | "option_d"]; return <Button key={key} type="button" variant={answers[question.id] === key ? "secondary" : "outline"} disabled={Boolean(attemptId)} onClick={() => setAnswers((current) => ({ ...current, [question.id]: key }))} className="h-auto justify-start whitespace-normal py-3 text-left">{key}. {text}</Button>; })}<Button type="button" variant={marked[question.id] ? "default" : "outline"} disabled={Boolean(attemptId)} onClick={() => setMarked((current) => ({ ...current, [question.id]: !current[question.id] }))} className="w-fit"><Flag className="h-4 w-4" /> {marked[question.id] ? "Marked" : "Mark for review"}</Button></CardContent></Card>)}</div><Button disabled={submit.isPending || Boolean(attemptId)} onClick={() => submit.mutate()}>{attemptId ? "Submitted" : "Submit test"}</Button></div>;
}
