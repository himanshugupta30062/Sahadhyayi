'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { getStatus, setStatus, toggleWishlist, ReadingStatus } from '../../lib/supabase/userBooks';
import { getNote, upsertNote } from '../../lib/supabase/notes';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  bookId: string;
  fileUrl?: string | null;
}

export default function BookActions({ bookId, fileUrl }: Props) {
  const [status, setStatusState] = useState<ReadingStatus | null>(null);
  const [wishlisted, setWishlisted] = useState(false);
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getStatus(bookId).then(setStatusState);
    getNote(bookId).then(setNote);
    supabase
      .from('user_wishlist')
      .select('id')
      .eq('book_id', bookId)
      .maybeSingle()
      .then(({ data }) => setWishlisted(!!data));
  }, [bookId]);

  const handleAdd = async () => {
    await setStatus(bookId, 'to_read');
    setStatusState('to_read');
  };

  const handleWishlist = async () => {
    const next = await toggleWishlist(bookId);
    setWishlisted(next);
  };

  const handleStatusChange = async (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const newStatus = e.target.value as ReadingStatus;
    await setStatus(bookId, newStatus);
    setStatusState(newStatus);
  };

  const handleOpen = async () => {
    await supabase
      .from('book_events')
      .insert({ book_id: bookId, event: 'view' });
  };

  const handleDownload = async () => {
    await supabase
      .from('book_events')
      .insert({ book_id: bookId, event: 'download' });
  };

  useEffect(() => {
    const t = setTimeout(() => {
      if (note !== '') {
        upsertNote(bookId, note)
          .then(() => setSaved(true))
          .catch(() => setSaved(false));
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [note, bookId]);

  return (
    <div className="space-y-4">
      {status ? (
        <select
          value={status}
          onChange={handleStatusChange}
          className="border rounded p-2"
          data-testid="status-select"
        >
          <option value="to_read">To Read</option>
          <option value="reading">Reading</option>
          <option value="completed">Completed</option>
        </select>
      ) : (
        <Button onClick={handleAdd} data-testid="add-btn">
          Add to My Library
        </Button>
      )}
      <Button onClick={handleWishlist} data-testid="wishlist-btn">
        {wishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
      </Button>
      <div className="space-x-2">
        <Button onClick={handleOpen} data-testid="open-btn">
          Open
        </Button>
        {fileUrl && (
          <Button onClick={handleDownload} data-testid="download-btn">
            Download
          </Button>
        )}
      </div>
      <div>
        <textarea
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            setSaved(false);
          }}
          className="w-full border rounded p-2"
          data-testid="note-editor"
        />
        {saved && <span className="text-green-600 ml-2" data-testid="saved-indicator">Saved</span>}
      </div>
    </div>
  );
}

