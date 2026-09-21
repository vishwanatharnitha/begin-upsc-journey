import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { STATUSES, statusClasses, statusLabel, type StatusValue } from "@/lib/upsc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/syllabus")({
  head: () => ({
    meta: [
      { title: "Syllabus tracker — BeginUPSC" },
      {
        name: "description",
        content: "Mark every Prelims and Mains topic as studying, revised or confident.",
      },
      { property: "og:title", content: "Syllabus tracker — BeginUPSC" },
      {
        property: "og:description",
        content: "Mark every Prelims and Mains topic as studying, revised or confident.",
      },
    ],
  }),
  component: SyllabusPage,
});

function SyllabusPage() {
  const queryClient = useQueryClient();
  const { user } = Route.useRouteContext();

  const subjects = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("id, name, stage, description, sort_order, topics(id, title, sort_order)")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const progress = useQuery({
    queryKey: ["topic_progress"],
    queryFn: async () => {
      const { data, error } = await supabase.from("topic_progress").select("topic_id, status");
      if (error) throw error;
      return data;
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ topicId, status }: { topicId: string; status: StatusValue }) => {
      const { error } = await supabase
        .from("topic_progress")
        .upsert({ user_id: user.id, topic_id: topicId, status }, { onConflict: "user_id,topic_id" });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["topic_progress"] }),
    onError: () => toast.error("Could not save that topic. Please try again."),
  });

  const statusFor = (topicId: string) =>
    progress.data?.find((p) => p.topic_id === topicId)?.status ?? "not_started";

  if (subjects.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading syllabus…</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Syllabus tracker</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Update each topic as you study. Your dashboard uses this to show overall progress.
        </p>
      </div>

      <div className="space-y-5">
        {subjects.data?.map((subject) => {
          const topics = [...(subject.topics ?? [])].sort((a, b) => a.sort_order - b.sort_order);
          const done = topics.filter((t) => statusFor(t.id) === "done").length;
          const pct = topics.length ? Math.round((done / topics.length) * 100) : 0;

          return (
            <Card key={subject.id} className="border-border/70">
              <CardHeader className="gap-2">
                <div className="flex flex-wrap items-center gap-3">
                  <CardTitle className="text-xl">{subject.name}</CardTitle>
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                    {subject.stage}
                  </span>
                  <span className="ml-auto text-sm text-muted-foreground">
                    {done}/{topics.length} confident
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{subject.description}</p>
                <Progress value={pct} className="mt-1" />
              </CardHeader>
              <CardContent className="divide-y divide-border/70 pt-0">
                {topics.map((topic) => {
                  const status = statusFor(topic.id);
                  return (
                    <div
                      key={topic.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClasses(status)}`}
                        >
                          {statusLabel(status)}
                        </span>
                        <span className="text-sm">{topic.title}</span>
                      </div>
                      <Select
                        value={status}
                        onValueChange={(v) =>
                          setStatus.mutate({ topicId: topic.id, status: v as StatusValue })
                        }
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
