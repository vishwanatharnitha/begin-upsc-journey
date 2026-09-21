import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/notes")({
  head: () => ({
    meta: [
      { title: "Revision notes — BeginUPSC" },
      {
        name: "description",
        content: "Write short, subject-wise revision notes you can re-read before the exam.",
      },
      { property: "og:title", content: "Revision notes — BeginUPSC" },
      {
        property: "og:description",
        content: "Write short, subject-wise revision notes you can re-read before the exam.",
      },
    ],
  }),
  component: NotesPage,
});

function NotesPage() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [subjectId, setSubjectId] = useState<string>("none");

  const subjects = useQuery({
    queryKey: ["subjects-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("id, name")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const notes = useQuery({
    queryKey: ["notes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notes")
        .select("id, title, content, subject_id, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addNote = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("notes").insert({
        user_id: user.id,
        title: title.trim(),
        content: content.trim() || null,
        subject_id: subjectId === "none" ? null : subjectId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setTitle("");
      setContent("");
      setSubjectId("none");
      toast.success("Note saved");
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
    onError: () => toast.error("Could not save the note. Please try again."),
  });

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notes"] }),
    onError: () => toast.error("Could not delete the note."),
  });

  const subjectName = (id: string | null) =>
    id ? subjects.data?.find((s) => s.id === id)?.name : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Revision notes</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Keep them short — one note per topic works best for last-month revision.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
        <Card className="h-fit border-border/70">
          <CardHeader>
            <CardTitle className="text-lg">New note</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!title.trim()) return;
                addNote.mutate();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="note-title">Title</Label>
                <Input
                  id="note-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Fundamental Rights — key cases"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="note-subject">Subject</Label>
                <Select value={subjectId} onValueChange={setSubjectId}>
                  <SelectTrigger id="note-subject">
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No subject</SelectItem>
                    {subjects.data?.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="note-content">Note</Label>
                <Textarea
                  id="note-content"
                  rows={7}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Points, dates, judgments, examples…"
                />
              </div>
              <Button type="submit" className="w-full" disabled={addNote.isPending}>
                {addNote.isPending ? "Saving…" : "Save note"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {notes.isLoading && <p className="text-sm text-muted-foreground">Loading notes…</p>}
          {notes.data?.length === 0 && (
            <Card className="border-dashed border-border">
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                No notes yet. Your first note will show up here.
              </CardContent>
            </Card>
          )}
          {notes.data?.map((note) => (
            <Card key={note.id} className="border-border/70">
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <CardTitle className="text-lg">{note.title}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteNote.mutate(note.id)}
                    className="text-muted-foreground"
                  >
                    Delete
                  </Button>
                </div>
                {subjectName(note.subject_id) && (
                  <span className="w-fit rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                    {subjectName(note.subject_id)}
                  </span>
                )}
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{note.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
