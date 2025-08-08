import React, { useState, useEffect } from "react";
import { Edit, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import AddStoryForm from "./AddStoryForm";
import { supabase } from "@/integrations/supabase/client-universal";
import { toast } from "@/hooks/use-toast";
import { errorHandler } from "@/utils/errorHandler";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import DOMPurify from "dompurify";

type StoriesSectionProps = {
  userId: string;
};

type Story = {
  id: string;
  title: string;
  description?: string;
  created_at: string;
  format: string;
};

const StoriesSection: React.FC<StoriesSectionProps> = ({ userId }) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchStories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("stories")
        .select("id, title, description, created_at, format")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setStories(data || []);
    } catch (err: any) {
      toast({
        title: "Load Failed",
        description: "Could not fetch your stories. Please try again.",
        variant: "destructive",
      });
      errorHandler.handleError({
        message: err.message,
        stack: err.stack,
        type: "custom",
        context: {
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          route: window.location.pathname,
          component: "StoriesSection",
          action: "fetchStories",
        },
        severity: "medium",
      });
      setStories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, [userId]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this story?")) return;
    try {
      const { error } = await supabase.from("stories").delete().eq("id", id);
      if (error) throw error;
      setStories((prev) => prev.filter((s) => s.id !== id));
      toast({ title: "Deleted", description: "The story was deleted." });
      // Security: Log story deletion (you may upgrade this to an audit trail later)
      console.log(`[AUDIT] User ${userId} deleted story ${id} at ${new Date().toISOString()}`);
    } catch (err: any) {
      toast({
        title: "Delete Failed",
        description: "Could not delete the story. Please try again.",
        variant: "destructive",
      });
      errorHandler.handleError({
        message: err.message,
        stack: err.stack,
        type: "custom",
        context: {
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          route: window.location.pathname,
          component: "StoriesSection",
          action: "deleteStory",
        },
        severity: "medium",
      });
    }
  };

  return (
    <section className="relative mt-2">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-lora font-bold text-orange-900 tracking-tight">
          Your Life Stories
        </h2>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {loading ? (
          <div className="text-orange-500 font-serif py-4">Loading your stories…</div>
        ) : stories.length === 0 ? (
          <div className="text-orange-300 italic font-serif py-4">
            You haven&apos;t written or recorded any stories yet.
          </div>
        ) : (
          stories.map((story) => (
            <div
              key={story.id}
              className="group bg-white rounded-2xl p-6 relative shadow transition-transform duration-200 hover:scale-105 hover:shadow-lg animate-fade-in-up flex flex-col justify-between min-h-[160px]"
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-lora text-lg text-orange-900 font-semibold">{story.title}</span>
                  <span className="bg-orange-100 text-orange-700 rounded-full px-3 py-0.5 ml-1 text-xs shadow font-sans uppercase">
                    {story.format}
                  </span>
                </div>
                <div className="text-orange-400 text-xs mb-1">
                  {new Date(story.created_at).toLocaleDateString()}
                </div>
                {story.description && (
                  // SECURITY: Sanitize description to prevent XSS
                  <div
                    className="text-orange-800 text-base font-serif mt-2"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(story.description),
                    }}
                  />
                )}
              </div>
              <div className="absolute right-4 top-4 flex gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full hover:bg-orange-50"
                      aria-label="Edit story"
                    >
                      <Edit className="w-5 h-5 text-orange-500 hover:scale-110 transition-transform" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Edit</TooltipContent>
                </Tooltip>
                <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full hover:bg-orange-50"
                      onClick={() => handleDelete(story.id)}
                      aria-label="Delete story"
                    >
                      <Trash2 className="w-5 h-5 text-red-400 hover:scale-110 transition-transform" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete</TooltipContent>
                </Tooltip>
              </div>
            </div>
          ))
        )}
      </div>
      {showForm && (
        <AddStoryForm
          userId={userId}
          onClose={() => {
            setShowForm(false);
            fetchStories();
          }}
        />
      )}
      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-8 right-8 z-30 flex items-center px-6 py-3 bg-orange-600 text-white text-base font-sans font-semibold rounded-full shadow-lg hover:bg-orange-700 hover:scale-105 transition-all focus:ring-4 focus:ring-orange-300 animate-fade-in-up"
        style={{
          boxShadow: "0 4px 14px rgba(255, 152, 0, 0.15)"
        }}
      >
        <Plus className="w-6 h-6 mr-2" />
        Share a New Story
      </button>
    </section>
  );
};

export default StoriesSection;
