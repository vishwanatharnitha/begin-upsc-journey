export const STATUSES = [
  { value: "not_started", label: "Not started", pct: 0 },
  { value: "studying", label: "In progress", pct: 35 },
  { value: "revised", label: "Revised", pct: 70 },
  { value: "done", label: "Completed", pct: 100 },
] as const;

export type StatusValue = (typeof STATUSES)[number]["value"];

export const PREPARATION_STAGES = ["Beginner", "Foundation", "Revision", "Test series", "Interview"];
export const CONTENT_TYPES = ["topic", "current_affairs", "question", "resource", "mains_question"] as const;
export const CA_CATEGORIES = [
  "Polity",
  "Economy",
  "International Relations",
  "Environment",
  "Science & Technology",
  "Geography",
  "History & Culture",
  "Government Schemes",
  "Social Issues",
  "Defence",
  "Reports & Indices",
];

export function statusLabel(value: string) {
  return STATUSES.find((s) => s.value === value)?.label ?? "Not started";
}

export function statusPercent(value: string) {
  return STATUSES.find((s) => s.value === value)?.pct ?? 0;
}

export function statusClasses(value: string) {
  switch (value) {
    case "studying":
    case "in_progress":
      return "bg-accent/20 text-accent-foreground border-accent/30";
    case "revised":
      return "bg-chart-5/20 text-foreground border-chart-5/30";
    case "done":
    case "completed":
      return "bg-success/20 text-foreground border-success/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (!hours) return `${mins}m`;
  if (!mins) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function words(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function safeError(error: unknown, fallback = "Something went wrong. Please try again.") {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
