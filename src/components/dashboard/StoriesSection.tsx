
import React, { useEffect, useState } from "react";
import { Edit, Trash2, BookOpen, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import AddStoryForm from "./AddStoryForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

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
    const { data, error } = await supabase
      .from("stories")
      .select("id, title, description, created_at, format")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (!error) setStories(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchStories();
  }, [userId]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this story?")) return;
    const { error } = await supabase.from("stories").delete().eq("id", id);
    if (!error) {
      setStories((prev) => prev.filter((s) => s.id !== id));
      toast({ title: "Deleted", description: "The story was deleted." });
    }
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-serif font-semibold text-stone-700">
          Your Life Stories
        </h2>
        <Button
          className="bg-stone-700 text-white hover:bg-stone-800 font-serif"
          onClick={() => setShowForm(true)}
        >
          <ArrowUp className="w-4 h-4 mr-2" />
          Write or Record New Story
        </Button>
      </div>
      {showForm && (
        <AddStoryForm userId={userId} onClose={() => { setShowForm(false); fetchStories(); }} />
      )}
      {loading ? (
        <div className="text-stone-500 font-serif py-4">Loading your stories...</div>
      ) : stories.length === 0 ? (
        <div className="text-stone-400 italic font-serif py-4">
          You haven't written or recorded any stories yet.
        </div>
      ) : (
        <div className="divide-y divide-stone-200 bg-white/60 rounded-md p-2">
          {stories.map((story) => (
            <div
              key={story.id}
              className="flex items-center justify-between py-3 group hover:bg-stone-50 transition rounded"
            >
              <div>
                <div className="font-serif text-stone-800 font-medium text-lg">{story.title}</div>
                <div className="text-stone-500 text-xs">
                  {story.format === "audio" ? "Voice" : "Text"} •{" "}
                  {new Date(story.created_at).toLocaleString()}
                </div>
                {story.description && (
                  <div className="text-stone-500 text-sm">{story.description}</div>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(story.id)}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default StoriesSection;
