
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

type AddStoryFormProps = {
  userId: string;
  onClose: () => void;
};

const AddStoryForm: React.FC<AddStoryFormProps> = ({ userId, onClose }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [format, setFormat] = useState<"text" | "audio">("text");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Placeholder: no real AI voice transcription
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    let audio_url: string | undefined;

    // For now, just ignore audio upload/transcription, but store format
    const { error } = await supabase.from("stories").insert([
      {
        user_id: userId,
        title,
        description,
        content,
        format,
        audio_url,
      },
    ]);
    setIsSubmitting(false);

    if (!error) {
      toast({ title: "Story added!", description: "Your story was published." });
      onClose();
    } else {
      toast({ title: "Error", description: error.message });
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm flex items-center justify-center">
      <form
        className="bg-white max-w-md w-full rounded-lg shadow-xl p-6 space-y-5 font-serif"
        onSubmit={handleSubmit}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-stone-800">Write or Record New Story</h3>
          <button type="button" onClick={onClose} className="text-stone-500 hover:text-stone-900">&times;</button>
        </div>
        <div>
          <label className="block text-stone-700 mb-1">Title</label>
          <input
            className="w-full border border-stone-300 rounded px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            required
          />
        </div>
        <div>
          <label className="block text-stone-700 mb-1">Description</label>
          <input
            className="w-full border border-stone-300 rounded px-3 py-2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={240}
          />
        </div>
        <div>
          <label className="block text-stone-700 mb-1">Format</label>
          <select
            className="w-full border border-stone-300 rounded px-3 py-2"
            value={format}
            onChange={(e) => setFormat(e.target.value as "text" | "audio")}
          >
            <option value="text">Text</option>
            <option value="audio">Voice</option>
          </select>
        </div>
        {format === "text" && (
          <div>
            <label className="block text-stone-700 mb-1">Story Content</label>
            <textarea
              className="w-full border border-stone-300 rounded px-3 py-2 min-h-[100px]"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={3000}
              required={format === "text"}
            />
          </div>
        )}
        {format === "audio" && (
          <div>
            <label className="block text-stone-700 mb-1">Upload Voice File (MP3/WAV)</label>
            <input
              type="file"
              accept=".mp3,.wav"
              disabled
              // Placeholder: No upload for now
              className="w-full border border-stone-300 rounded px-3 py-2 text-stone-500"
            />
            <div className="mt-2 text-xs text-stone-400">Audio upload/transcription coming soon!</div>
          </div>
        )}
        <div className="flex gap-2 mt-2">
          <Button
            type="submit"
            className="bg-stone-700 text-white hover:bg-stone-800 px-6"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Adding..." : "Publish"}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddStoryForm;
