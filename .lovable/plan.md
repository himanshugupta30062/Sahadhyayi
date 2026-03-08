

# Fix Missing Book Covers

## Problem
Books with missing or broken `cover_image_url` values show a plain gradient with a small icon. The current fallback is too generic and doesn't help users identify books.

## Solution
Create a visually distinct, colorful generated cover for books without images. Each book gets a unique color based on its title, displaying the book title prominently and the author name — mimicking a real book spine/cover design.

## Changes

### 1. Update `src/components/library/BookCard.tsx`
- Replace the plain gradient fallback with a **generated book cover** component
- Use a deterministic color palette based on the book title (hash the title to pick a color pair)
- Display: book title (large, centered), author name (smaller, bottom), and a decorative pattern

### 2. Create `src/components/library/GeneratedBookCover.tsx`
A reusable component that renders a styled placeholder cover:
- Deterministic gradient colors derived from the book title (so the same book always gets the same color)
- Title displayed prominently in the center (up to ~60 chars)
- Author at the bottom
- Genre badge if available
- Subtle decorative elements (lines, shapes via CSS) to look like a designed cover
- 10+ color palettes to ensure visual variety across the grid

### 3. Update `EnhancedLazyImage` fallback usage
- Pass the new `GeneratedBookCover` as the fallback prop so broken URLs also show the designed cover instead of "Failed to load"

This approach requires no database changes — it's purely a frontend enhancement that makes the library look complete regardless of missing cover data.

