import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { askAiAssistant } from "@/lib/ai.functions";
import { pageMeta } from "@/lib/pageMeta";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/ai-assistant")({ head: () => pageMeta("AI assistant — BEGIN UPSC", "AI-assisted UPSC study helper for concepts, summaries, MCQs, Mains structure and plans."), component: AiAssistantPage });

function AiAssistantPage() {
  const askAi = useServerFn(askAiAssistant);
  const [mode, setMode] = useState<"explain" | "summarize" | "mcq" | "mains" | "plan">("explain");
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit() { if (prompt.trim().length < 8) return; setBusy(true); try { const result = await askAi({ data: { mode, prompt } }); setAnswer(`${result.disclaimer}\n\n${result.answer}`); } catch { toast.error("AI assistant is unavailable right now."); } finally { setBusy(false); } }
  return <div className="space-y-6"><PageHeader title="AI assistant" description="AI-assisted study support. It is never official UPSC guidance and should be verified with trusted sources." /><Card className="border-border/70"><CardHeader><CardTitle>Ask for study support</CardTitle></CardHeader><CardContent className="space-y-4"><Select value={mode} onValueChange={(value) => setMode(value as typeof mode)}><SelectTrigger className="max-w-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="explain">Explain concept</SelectItem><SelectItem value="summarize">Summarize notes</SelectItem><SelectItem value="mcq">Generate MCQs</SelectItem><SelectItem value="mains">Structure Mains answer</SelectItem><SelectItem value="plan">Study plan</SelectItem></SelectContent></Select><Textarea rows={7} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Ask a UPSC study question…" /><Button onClick={submit} disabled={busy || prompt.trim().length < 8}>{busy ? "Thinking…" : "Ask assistant"}</Button></CardContent></Card>{answer ? <Card className="border-border/70"><CardHeader><CardTitle>Response</CardTitle></CardHeader><CardContent className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{answer}</CardContent></Card> : null}</div>;
}
