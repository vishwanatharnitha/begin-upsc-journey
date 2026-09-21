import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inputSchema = z.object({
  prompt: z.string().min(8).max(1800),
  mode: z.enum(["explain", "summarize", "mcq", "mains", "plan"]),
});

function extractSseData(chunk: string) {
  return chunk
    .split("\n")
    .filter((line) => line.startsWith("data: "))
    .map((line) => line.slice(6).trim())
    .filter((line) => line && line !== "[DONE]");
}

export const askAiAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => inputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI assistant is not configured yet.");

    const taskLabel = {
      explain: "Explain the UPSC concept clearly with examples and revision pointers.",
      summarize: "Summarize the provided study material into exam-ready notes.",
      mcq: "Generate practice MCQs with options, answer key and explanations.",
      mains: "Help structure a Mains answer with introduction, body, examples and conclusion.",
      plan: "Create a practical study plan with time blocks and revision checkpoints.",
    }[data.mode];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        reasoning: { effort: "low", summary: "auto" },
        input: [
          {
            role: "system",
            content:
              "You are BEGIN UPSC's AI-assisted study helper. Be accurate, concise, exam-oriented and never claim to be official UPSC guidance. Keep answers under 700 words unless the user asks otherwise.",
          },
          {
            role: "user",
            content: `${taskLabel}\n\nStudent request:\n${data.prompt}`,
          },
        ],
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error("AI assistant could not respond right now.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let answer = "";
    let reasoning = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";
      for (const part of parts) {
        for (const payload of extractSseData(part)) {
          try {
            const event = JSON.parse(payload) as {
              type?: string;
              delta?: string;
              response?: { output_text?: string };
            };
            if (event.type === "response.output_text.delta" && event.delta) answer += event.delta;
            if (event.type === "response.reasoning_summary_text.delta" && event.delta) {
              reasoning += event.delta;
            }
            if (event.type === "response.completed" && !answer && event.response?.output_text) {
              answer = event.response.output_text;
            }
          } catch {
            // Ignore malformed stream fragments.
          }
        }
      }
    }

    return {
      answer:
        answer.trim() ||
        reasoning.trim() ||
        "I could not produce a useful answer. Please add more detail and try again.",
      disclaimer: "AI-assisted feedback only — not official UPSC guidance.",
    };
  });
