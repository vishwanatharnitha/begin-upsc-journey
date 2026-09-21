import { Button } from "@/components/ui/button";

export function PaginationControls({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border/70 bg-card px-3 py-2 text-sm text-muted-foreground">
      <span>
        Page {page + 1} of {totalPages}
      </span>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" disabled={page === 0} onClick={() => onPageChange(Math.max(0, page - 1))}>
          Previous
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={page + 1 >= totalPages} onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}>
          Next
        </Button>
      </div>
    </div>
  );
}
