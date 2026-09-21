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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin/syllabus")({ head: () => pageMeta("Admin syllabus — BEGIN UPSC", "Manage subjects and hierarchical syllabus topics."), component: AdminSyllabus });

function AdminSyllabus() {
  const { isAdmin } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const subjects = useQuery({ queryKey: ["subjects"], enabled: isAdmin, queryFn: async () => { const { data, error } = await supabase.from("subjects").select("id, name").order("display_order"); if (error) throw error; return data ?? []; }});
  const topics = useQuery({ queryKey: ["admin-syllabus-topics"], enabled: isAdmin, queryFn: async () => { const { data, error } = await supabase.from("syllabus_topics").select("id, title, subjects(name)").order("display_order"); if (error) throw error; return data ?? []; }});
  const add = useMutation({ mutationFn: async () => { const chosenSubject = subjectId || subjects.data?.[0]?.id; if (!chosenSubject) throw new Error("Choose a subject"); const { error } = await supabase.from("syllabus_topics").insert({ title, subject_id: chosenSubject }); if (error) throw error; }, onSuccess: () => { setTitle(""); toast.success("Topic added"); queryClient.invalidateQueries({ queryKey: ["admin-syllabus-topics"] }); queryClient.invalidateQueries({ queryKey: ["syllabus_topics"] }); }, onError: () => toast.error("Could not add topic.") });
  const selectedSubject = subjectId || subjects.data?.[0]?.id || "";
  return <AdminGate isAdmin={isAdmin}><div className="space-y-6"><PageHeader title="Syllabus admin" description="Add syllabus topics. Learners can track progress but cannot edit this master content." /><Card className="border-border/70"><CardHeader><CardTitle>New topic</CardTitle></CardHeader><CardContent><form className="grid gap-3 md:grid-cols-[1fr_260px_auto]" onSubmit={(e) => { e.preventDefault(); add.mutate(); }}><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Topic title" required /><Select value={selectedSubject} onValueChange={setSubjectId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{subjects.data?.map((subject) => <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>)}</SelectContent></Select><Button type="submit">Add</Button></form></CardContent></Card><div className="grid gap-3 md:grid-cols-2">{topics.data?.map((topic) => <Card key={topic.id} className="border-border/70"><CardContent className="pt-6"><p className="font-medium">{topic.title}</p><p className="text-sm text-muted-foreground">{topic.subjects?.name}</p></CardContent></Card>)}</div></div></AdminGate>;
}
