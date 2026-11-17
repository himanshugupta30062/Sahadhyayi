import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock3, FlaskConical, Loader2, RefreshCw, XCircle } from "lucide-react";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client-universal";
import { useAuth } from "@/contexts/authHelpers";

type ModerationStatus = "pending" | "approved" | "rejected";
type Submission = {
  id: string;
  user_id: string;
  experiment_id: string;
  observations: string;
  what_learned: string | null;
  worked: boolean | null;
  created_at: string;
  moderation_status: ModerationStatus;
  moderation_note: string | null;
  experiment: { title: string; category: string } | null;
};

const STATUS_OPTIONS: Array<{ value: ModerationStatus; label: string }> = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export default function AdminScienceLabModeration() {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<ModerationStatus>("pending");
  const [notes, setNotes] = useState<Record<string, string>>({});

  const roleQuery = useQuery({
    queryKey: ["science-lab-moderation-admin", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("is_admin");
      if (error) throw error;
      return data === true;
    },
  });

  const submissionsQuery = useQuery({
    queryKey: ["science-lab-moderation-queue", status],
    enabled: roleQuery.data === true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("science_experiment_attempts" as any)
        .select("id,user_id,experiment_id,observations,what_learned,worked,created_at,moderation_status,moderation_note,experiment:science_experiments(title,category)")
        .eq("share_public", true)
        .eq("moderation_status", status)
        .order("created_at", { ascending: true })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as unknown as Submission[];
    },
  });

  const moderationMutation = useMutation({
    mutationFn: async ({ id, decision }: { id: string; decision: "approved" | "rejected" }) => {
      const note = (notes[id] ?? "").trim();
      if (decision === "rejected" && !note) {
        throw new Error("Add a short moderation note before rejecting this submission.");
      }
      const { error } = await supabase
        .from("science_experiment_attempts" as any)
        .update({ moderation_status: decision, moderation_note: note || null })
        .eq("id", id)
        .eq("moderation_status", "pending")
        .select("id")
        .maybeSingle();
      if (error) throw error;
      if (!data?.id) throw new Error("This submission has already been reviewed or is no longer available.");
    },
    onSuccess: async (_data, variables) => {
      toast.success(variables.decision === "approved" ? "Experiment approved for community sharing." : "Submission declined.");
      await queryClient.invalidateQueries({ queryKey: ["science-lab-moderation-queue"] });
      await queryClient.invalidateQueries({ queryKey: ["science-lab-moderation-admin"] });
    },
    onError: (error: Error) => toast.error(error.message || "Could not update this submission."),
  });

  if (authLoading || (!!user && roleQuery.isLoading)) {
    return <div className="mx-auto max-w-5xl space-y-4 p-6"><Skeleton className="h-10 w-72" /><Skeleton className="h-48 w-full" /><Skeleton className="h-48 w-full" /></div>;
  }
  if (!user || roleQuery.data !== true) return <Navigate to="/" replace />;

  const submissions = submissionsQuery.data ?? [];

  return (
    <>
      <SEO title="Science Lab Moderation" description="Review Science Lab community sharing requests." noIndex />
      <main className="min-h-screen bg-background px-4 py-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground"><FlaskConical className="h-4 w-4" /> Admin workspace</div>
              <h1 className="text-3xl font-bold">Science Lab moderation</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Review experiment observations before they become visible in the community. Uploaded photos and videos are private and are not included here.</p>
            </div>
            <Button variant="outline" onClick={() => void submissionsQuery.refetch()} disabled={submissionsQuery.isFetching}>
              {submissionsQuery.isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />} Refresh queue
            </Button>
          </div>

          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Moderation status">
            {STATUS_OPTIONS.map((option) => (
              <Button key={option.value} size="sm" variant={status === option.value ? "default" : "outline"} onClick={() => setStatus(option.value)} role="tab" aria-selected={status === option.value}>
                {option.label}
              </Button>
            ))}
          </div>

          {submissionsQuery.isLoading && <div className="space-y-4"><Skeleton className="h-48 w-full" /><Skeleton className="h-48 w-full" /></div>}
          {submissionsQuery.isError && <Card><CardContent className="py-8 text-center"><p className="text-sm text-destructive">Could not load the moderation queue.</p><Button className="mt-3" variant="outline" onClick={() => void submissionsQuery.refetch()}>Try again</Button></CardContent></Card>}
          {!submissionsQuery.isLoading && !submissionsQuery.isError && submissions.length === 0 && (
            <Card><CardContent className="py-12 text-center"><CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><p className="font-medium">No {status} submissions</p><p className="mt-1 text-sm text-muted-foreground">There are currently no experiment sharing requests in this queue.</p></CardContent></Card>
          )}

          <div className="space-y-4">
            {submissions.map((submission) => (
              <Card key={submission.id}>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{submission.experiment?.title ?? "Science experiment"}</CardTitle>
                      <p className="text-xs text-muted-foreground">{submission.experiment?.category ?? "Science"} · Submitted {new Date(submission.created_at).toLocaleString()} · User {submission.user_id.slice(0, 8)}…</p>
                    </div>
                    <Badge variant={status === "approved" ? "default" : status === "rejected" ? "destructive" : "secondary"}>{status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <section>
                    <h3 className="mb-1 text-sm font-semibold">Observation</h3>
                    <p className="whitespace-pre-wrap text-sm leading-6">{submission.observations}</p>
                  </section>
                  {submission.what_learned && <section><h3 className="mb-1 text-sm font-semibold">What the learner learned</h3><p className="whitespace-pre-wrap text-sm text-muted-foreground">{submission.what_learned}</p></section>}
                  <p className="text-xs text-muted-foreground">Reported outcome: {submission.worked === null ? "Not specified" : submission.worked ? "Worked as expected" : "Did not work as expected"}</p>
                  {submission.moderation_note && <div className="rounded-md bg-muted p-3 text-sm"><span className="font-medium">Moderator note: </span>{submission.moderation_note}</div>}
                  {status === "pending" && (
                    <div className="space-y-3 border-t border-border pt-4">
                      <Textarea value={notes[submission.id] ?? ""} onChange={(event) => setNotes((current) => ({ ...current, [submission.id]: event.target.value }))} placeholder="Optional note for approval; required if rejecting (max 500 characters)." maxLength={500} rows={2} />
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={() => moderationMutation.mutate({ id: submission.id, decision: "approved" })} disabled={moderationMutation.isPending}><CheckCircle2 className="mr-2 h-4 w-4" /> Approve</Button>
                        <Button variant="destructive" onClick={() => moderationMutation.mutate({ id: submission.id, decision: "rejected" })} disabled={moderationMutation.isPending}><XCircle className="mr-2 h-4 w-4" /> Reject</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="flex items-center gap-2 text-xs text-muted-foreground"><Clock3 className="h-3.5 w-3.5" /> Queue access and decisions are enforced by Supabase RLS, not just by this page.</p>
        </div>
      </main>
    </>
  );
}
