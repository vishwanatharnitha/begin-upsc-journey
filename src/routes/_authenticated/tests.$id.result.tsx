import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { pageMeta } from "@/lib/pageMeta";
import { MetricCard } from "@/components/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/_authenticated/tests/$id/result")({ head: () => pageMeta("Test result — BEGIN UPSC", "Review saved score, accuracy and per-question answers."), component: ResultPage });

function ResultPage() {
  const { id } = Route.useParams();
  const attempt = useQuery({ queryKey: ["attempt", id], queryFn: async () => { const { data, error } = await supabase.from("test_attempts").select("id, score, accuracy, correct_answers, incorrect_answers, unanswered, total_questions, test_answers(selected_option, is_correct, questions(question_text, correct_option, explanation))").eq("id", id).maybeSingle(); if (error) throw error; return data; }});
  const data = attempt.data;
  return <div className="space-y-6"><PageHeader title="Test result" description="This analysis is based only on your saved answers." /><div className="grid gap-5 md:grid-cols-4"><MetricCard label="Score" value={String(data?.score ?? 0)} helper="Saved attempt" /><MetricCard label="Accuracy" value={`${Math.round(data?.accuracy ?? 0)}%`} /><MetricCard label="Correct" value={String(data?.correct_answers ?? 0)} /><MetricCard label="Unanswered" value={String(data?.unanswered ?? 0)} /></div><Card className="border-border/70"><CardHeader><CardTitle>Answer review</CardTitle></CardHeader><CardContent className="space-y-4">{data?.test_answers?.map((answer, index) => <div key={index} className="rounded-md border border-border/70 p-4"><p className="font-medium">{answer.questions?.question_text}</p><p className="mt-2 text-sm text-muted-foreground">Your answer: {answer.selected_option ?? "Unanswered"} · Correct: {answer.questions?.correct_option}</p><p className="mt-2 text-sm text-muted-foreground">{answer.questions?.explanation}</p></div>)}</CardContent></Card></div>;
}
