
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { BookOpen, Plus, Minus } from "lucide-react";

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

  const handleUpdate = async (id: number, newPage: number) => {
    if (Number.isNaN(newPage) || newPage < 1) return;
    const found = items.find((item) => item.id === id);
    if (found && newPage > found.total_pages) return;
    const { error } = await supabase
      .from("reading_progress")
      .update({ current_page: newPage })
      .eq("id", id);
    if (!error) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, current_page: newPage } : i
        )
      );
    }
  };

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-lora font-bold text-orange-900 mb-6 tracking-tight">Books You’re Reading</h2>
      <div className="flex flex-col gap-7">
        {loading ? (
          <div className="text-orange-400 font-serif py-4">Loading book progress…</div>
        ) : items.length === 0 ? (
          <div className="text-orange-200 italic font-serif py-2">
            No books in progress. Start tracking your reading!
          </div>
        ) : (
          items.map((item) => {
            const percent = Math.round((item.current_page / item.total_pages) * 100);
            return (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row items-center bg-white rounded-lg shadow-xl py-5 px-6 gap-6 animate-fade-in-up group hover:shadow-2xl hover:scale-[1.03] transition-transform"
              >
                {item.cover_image_url ? (
                  <img
                    src={item.cover_image_url}
                    alt={item.book_title}
                    className="w-16 h-24 object-cover rounded shadow border border-orange-200"
                  />
                ) : (
                  <div className="w-16 h-24 bg-orange-100 rounded flex items-center justify-center text-orange-400">
                    <BookOpen className="w-10 h-10" />
                  </div>
                )}
                <div className="flex flex-col flex-grow min-w-0">
                  <div className="text-lg font-lora font-semibold mb-1 text-orange-900">{item.book_title}</div>
                  <div className="text-orange-500 text-xs mb-3">
                    Page <span className="font-bold">{item.current_page}</span> of {item.total_pages}
                  </div>
                  <Progress value={percent} className="bg-orange-50 h-3 rounded-lg shadow-inner transition-all duration-700" />
                  <div className="mt-3 flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="border border-orange-300 rounded-full text-orange-700 hover:bg-orange-100 transition"
                      aria-label="Decrease page"
                      onClick={() => handleUpdate(item.id, item.current_page - 1)}
                      disabled={item.current_page <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <input
                      type="number"
                      className="border border-orange-200 rounded-lg px-2 py-1 w-16 text-center text-orange-800 font-bold focus:ring-2 focus:ring-orange-300 transition"
                      value={item.current_page}
                      min={1}
                      max={item.total_pages}
                      onChange={(e) =>
                        handleUpdate(item.id, Number(e.target.value))
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="border border-orange-300 rounded-full text-orange-700 hover:bg-orange-100 transition"
                      aria-label="Increase page"
                      onClick={() => handleUpdate(item.id, item.current_page + 1)}
                      disabled={item.current_page >= item.total_pages}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="link"
                      className="ml-6 text-orange-700 font-sans font-semibold underline text-sm transition hover:text-orange-900"
                      onClick={() => alert("Coming soon: embedded PDF reader!")}
                    >
                      Continue Reading
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};

export default ReadingTracker;
