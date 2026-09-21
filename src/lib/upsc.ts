export const STATUSES = [
  { value: "not_started", label: "Not started" },
  { value: "studying", label: "Studying" },
  { value: "revised", label: "Revised" },
  { value: "done", label: "Confident" },
] as const;

export type StatusValue = (typeof STATUSES)[number]["value"];

export function statusLabel(value: string) {
  return STATUSES.find((s) => s.value === value)?.label ?? "Not started";
}

export function statusClasses(value: string) {
  switch (value) {
    case "studying":
      return "bg-accent/20 text-accent-foreground";
    case "revised":
      return "bg-chart-5/20 text-foreground";
    case "done":
      return "bg-success/20 text-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}
