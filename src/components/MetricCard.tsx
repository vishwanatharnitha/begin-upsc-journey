import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

export function MetricCard({
  label,
  value,
  detail,
  helper,
  icon,
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode | undefined;
  helper?: ReactNode | undefined;
  icon?: ReactNode | undefined;
}) {
  const supportText = detail ?? helper;
  return (
    <Card className="border-border/70 bg-card/90">
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <div className="mt-2 text-2xl font-semibold text-foreground">{value}</div>
          {supportText ? <div className="mt-1 text-xs text-muted-foreground">{supportText}</div> : null}
        </div>
        {icon ? <div className="rounded-md bg-secondary p-2 text-primary">{icon}</div> : null}
      </CardContent>
    </Card>
  );
}
