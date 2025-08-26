'use client';

import { useEffect, useState } from 'react';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { getStatus, setStatus, toggleWishlist, touchLastOpened } from '@/lib/supabase/userBooks';
import { getNote, upsertNote } from '@/lib/supabase/notes';
import type { ReadingStatus } from '@/lib/types';
import { supabase } from '../../integrations/supabase/client';
const supabaseClient: any = supabase;

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
    supabaseClient
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
    await touchLastOpened(bookId);
    await supabaseClient
      .from('book_events')
      .insert({ book_id: bookId, event: 'view' });
  };

  const handleDownload = async () => {
    await supabaseClient
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
    <div className="space-y-4" data-testid="book-actions">
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
        <button
          onClick={handleAdd}
          data-testid="add-btn"
          className="rounded border px-3 py-1"
        >
          Add to My Library
        </button>
      )}
      <button
        onClick={handleWishlist}
        data-testid="wishlist-btn"
        className="rounded border px-3 py-1"
      >
        {wishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
      </button>
      <div className="space-x-2">
        <button
          onClick={handleOpen}
          data-testid="open-btn"
          className="rounded border px-3 py-1"
        >
          Open
        </button>
        {fileUrl && (
          <button
            onClick={handleDownload}
            data-testid="download-btn"
            className="rounded border px-3 py-1"
          >
            Download
          </button>
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

