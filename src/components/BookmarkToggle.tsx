import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function BookmarkToggle({ userId, contentType, contentId }: { userId: string; contentType: string; contentId: string }) {
  const queryClient = useQueryClient();
  const key = ["bookmark", contentType, contentId];
  const bookmark = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookmarks")
        .select("id")
        .eq("content_type", contentType)
        .eq("content_id", contentId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const toggle = useMutation({
    mutationFn: async () => {
      if (bookmark.data?.id) {
        const { error } = await supabase.from("bookmarks").delete().eq("id", bookmark.data.id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from("bookmarks").insert({ user_id: userId, content_type: contentType, content_id: contentId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
    onError: () => toast.error("Could not update bookmark."),
  });

  return (
    <Button type="button" variant={bookmark.data ? "default" : "outline"} size="sm" onClick={() => toggle.mutate()} disabled={toggle.isPending}>
      <Bookmark className="h-4 w-4" /> {bookmark.data ? "Bookmarked" : "Bookmark"}
    </Button>
  );
}
