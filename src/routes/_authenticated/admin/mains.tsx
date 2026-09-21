import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { pageMeta } from "@/lib/pageMeta";
import { AdminGate } from "@/components/AdminGate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/PageHeader";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/admin/mains")({ head: () => pageMeta("Admin Mains — BEGIN UPSC", "Create, publish and manage Mains answer-writing questions."), component: AdminMains });

function AdminMains() {
  const { isAdmin } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const [question, setQuestion] = useState("");
  const [paper, setPaper] = useState("GS Paper 2");
  const [wordLimit, setWordLimit] = useState("150");
  const mains = useQuery({ queryKey: ["admin-mains"], enabled: isAdmin, queryFn: async () => { const { data, error } = await supabase.from("mains_questions").select("id, question_text, paper, published, word_limit").order("created_at", { ascending: false }); if (error) throw error; return data ?? []; }});
  const add = useMutation({ mutationFn: async () => { const { error } = await supabase.from("mains_questions").insert({ question_text: question, paper, word_limit: Number(wordLimit) || 150, published: true }); if (error) throw error; }, onSuccess: () => { setQuestion(""); toast.success("Mains question added"); queryClient.invalidateQueries({ queryKey: ["admin-mains"] }); }, onError: () => toast.error("Could not save Mains question.") });
  const patch = useMutation({ mutationFn: async ({ id, published }: { id: string; published: boolean }) => { const { error } = await supabase.from("mains_questions").update({ published }).eq("id", id); if (error) throw error; }, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-mains"] }) });
  return <AdminGate isAdmin={isAdmin}><div className="space-y-6"><PageHeader title="Mains admin" description="Manage published answer-writing prompts and keep learner submissions separate." /><Card className="border-border/70"><CardHeader><CardTitle>New Mains question</CardTitle></CardHeader><CardContent><form className="space-y-4" onSubmit={(e) => { e.preventDefault(); add.mutate(); }}><Textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Question text" required /><div className="grid gap-3 sm:grid-cols-2"><Input value={paper} onChange={(e) => setPaper(e.target.value)} placeholder="Paper" /><Input type="number" value={wordLimit} onChange={(e) => setWordLimit(e.target.value)} placeholder="Word limit" /></div><Button type="submit">Save question</Button></form></CardContent></Card><div className="space-y-3">{mains.data?.map((item) => <Card key={item.id} className="border-border/70"><CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6"><div><p className="font-medium">{item.question_text}</p><p className="text-sm text-muted-foreground">{item.paper} · {item.word_limit} words</p></div><Button variant="outline" size="sm" onClick={() => patch.mutate({ id: item.id, published: !item.published })}>{item.published ? "Unpublish" : "Publish"}</Button></CardContent></Card>)}</div></div></AdminGate>;
}
