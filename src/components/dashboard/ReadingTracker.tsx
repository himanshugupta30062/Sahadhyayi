
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

type ReadingTrackerProps = {
  userId: string;
};

type ProgressItem = {
  id: number;
  book_title: string;
  total_pages: number;
  current_page: number;
  cover_image_url?: string;
};

const ReadingTracker: React.FC<ReadingTrackerProps> = ({ userId }) => {
  const [items, setItems] = useState<ProgressItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProgress() {
      setLoading(true);
      const { data, error } = await supabase
        .from("reading_progress")
        .select("id, book_title, total_pages, current_page, cover_image_url")
        .eq("user_id", userId);
      if (!error && data) setItems(data);
      setLoading(false);
    }
    fetchProgress();
  }, [userId]);

  const handleUpdate = async (id: number, current_page: number) => {
    if (Number.isNaN(current_page) || current_page < 1) return;
    const found = items.find((item) => item.id === id);
    if (found && current_page > found.total_pages) return;
    const { error } = await supabase
      .from("reading_progress")
      .update({ current_page })
      .eq("id", id);
    if (!error) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, current_page } : i
        )
      );
    }
  };

  return (
    <section>
      <h2 className="text-xl font-serif font-semibold text-stone-700 mb-4">Currently Reading</h2>
      {loading ? (
        <div className="text-stone-500 font-serif py-4">Loading book progress…</div>
      ) : items.length === 0 ? (
        <div className="text-stone-400 italic font-serif py-3">
          No books in progress. Start tracking your reading!
        </div>
      ) : (
        <div className="space-y-6">
          {items.map((item) => {
            const percent = Math.round((item.current_page / item.total_pages) * 100);
            return (
              <div
                key={item.id}
                className="flex items-center gap-5 p-4 bg-white/70 rounded-lg shadow"
              >
                {item.cover_image_url ? (
                  <img
                    src={item.cover_image_url}
                    alt={item.book_title}
                    className="w-16 h-24 object-cover rounded shadow border"
                  />
                ) : (
                  <div className="w-16 h-24 bg-stone-300 rounded flex items-center justify-center text-stone-500">
                    <BookOpen className="w-8 h-8" />
                  </div>
                )}
                <div className="flex flex-col flex-grow min-w-0">
                  <div className="text-lg font-serif">{item.book_title}</div>
                  <div className="text-stone-500 text-xs mb-2">
                    Page {item.current_page} / {item.total_pages}
                  </div>
                  <Progress value={percent} />
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      className="border rounded px-2 py-1 w-20"
                      value={item.current_page}
                      min={1}
                      max={item.total_pages}
                      onChange={(e) =>
                        handleUpdate(item.id, Number(e.target.value))
                      }
                    />
                    <span className="text-xs text-stone-500">Update page</span>
                    <Button
                      variant="link"
                      className="ml-4 text-amber-700 font-serif underline"
                      onClick={() => alert("Coming soon: embedded PDF reader!")}
                    >
                      Continue Reading
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default ReadingTracker;
