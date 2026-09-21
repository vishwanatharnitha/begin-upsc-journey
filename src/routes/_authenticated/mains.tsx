import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { pageMeta } from "@/lib/pageMeta";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/_authenticated/mains")({ head: () => pageMeta("Mains answer writing — BEGIN UPSC", "Write Mains answers, save submissions and receive clearly labelled AI-assisted feedback."), component: MainsPage });

function MainsPage() {
  const questions = useQuery({ queryKey: ["mains_questions"], queryFn: async () => { const { data, error } = await supabase.from("mains_questions").select("id, question_text, paper, difficulty, word_limit, marks").eq("published", true).order("created_at", { ascending: false }).limit(50); if (error) throw error; return data ?? []; }});
  return <div className="space-y-6"><PageHeader title="Mains answer writing" description="Pick a question, write with word count, save your answer and request AI-assisted study feedback." /><div className="grid gap-5">{questions.data?.map((question) => <Card key={question.id} className="border-border/70"><CardHeader><div className="flex flex-wrap gap-2"><Badge>{question.paper}</Badge><Badge variant="secondary">{question.difficulty}</Badge><Badge variant="outline">{question.word_limit} words · {question.marks} marks</Badge></div><CardTitle className="text-lg leading-7"><Link to="/mains/$id" params={{ id: question.id }} className="hover:underline">{question.question_text}</Link></CardTitle></CardHeader></Card>)}{questions.data?.length === 0 ? <p className="text-sm text-muted-foreground">No published Mains questions yet.</p> : null}</div></div>;
}
