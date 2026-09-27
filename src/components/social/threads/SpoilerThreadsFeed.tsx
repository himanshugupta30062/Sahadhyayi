import React, { useState } from "react";
import { useSpoilerThreads } from "@/hooks/useSpoilerThreads";
import { useAuth } from "@/contexts/authHelpers";
import { NewSpoilerThreadDialog } from "./NewSpoilerThreadDialog";
import { SpoilerThreadList } from "./SpoilerThreadList";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Loader2, ShieldAlert } from "lucide-react";

export const SpoilerThreadsFeed: React.FC = () => {
  const { user } = useAuth();
  const { data: threads = [], isLoading, error } = useSpoilerThreads();

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-500" />
            Chapter Spoiler-Safe Threads
          </h2>
          <p className="text-xs text-muted-foreground">
            Discussions strictly locked to chapter milestones. Spoilers are impossible by construction.
          </p>
        </div>

        {user && <NewSpoilerThreadDialog />}
      </div>

      {/* Loading & Error States */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
        </div>
      )}

      {error && (
        <Card className="border-destructive/30">
          <CardContent className="py-6 text-center text-sm text-destructive">
            Failed to load threads. Please try again.
          </CardContent>
        </Card>
      )}

      {/* Threads List */}
      {!isLoading && !error && (
        <SpoilerThreadList threads={threads} isLoading={isLoading} />
      )}
    </div>
  );
};

export default SpoilerThreadsFeed;
