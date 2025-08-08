'use client';

import Index from '@/pages/Index';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

export default function HomeWrapper() {
  return (
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<Index />} />
      </Routes>
    </MemoryRouter>
  );
}
