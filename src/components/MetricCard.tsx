import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

export function MetricCard({ label, value, detail, icon }: { label: string; value: ReactNode; detail?: ReactNode; icon?: ReactNode }) {
  return (
    <Card className="border-border/70 bg-card/90">
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <div className="mt-2 text-2xl font-semibold text-foreground">{value}</div>
          {detail ? <div className="mt-1 text-xs text-muted-foreground">{detail}</div> : null}
        </div>
        {icon ? <div className="rounded-md bg-secondary p-2 text-primary">{icon}</div> : null}
      </CardContent>
    </Card>
  );
}
