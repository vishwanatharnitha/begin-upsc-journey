import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — BeginUPSC" },
      {
        name: "description",
        content: "See your syllabus progress, study hours this week and recent notes.",
      },
      { property: "og:title", content: "Dashboard — BeginUPSC" },
      {
        property: "og:description",
        content: "See your syllabus progress, study hours this week and recent notes.",
      },
    ],
  }),
  component: Dashboard;
});

function Dashboard() {
  return null;
}
