'use client';

import Library from '@/pages/library';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

export default function LibraryWrapper() {
  return (
    <MemoryRouter initialEntries={['/library']}>
      <Routes>
        <Route path="/library" element={<Library />} />
      </Routes>
    </MemoryRouter>
  );
}
