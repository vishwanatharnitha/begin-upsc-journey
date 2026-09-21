import { ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function AdminGate({ isAdmin, children }: { isAdmin: boolean; children: React.ReactNode }) {
  if (!isAdmin) {
    return (
      <Card className="border-border/70">
        <CardContent className="flex items-center gap-3 py-10 text-sm text-muted-foreground">
          <ShieldAlert className="h-5 w-5" /> Admin access is required for this area.
        </CardContent>
      </Card>
    );
  }
  return <>{children}</>;
}
