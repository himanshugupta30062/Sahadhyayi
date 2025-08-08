'use client';

import BookDetails from '@/pages/BookDetails';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

export default function BookDetailsWrapper({ id }: { id: string }) {
  return (
    <MemoryRouter initialEntries={[`/book/${id}`]}>
      <Routes>
        <Route path="/book/:id" element={<BookDetails />} />
      </Routes>
    </MemoryRouter>
  );
}
