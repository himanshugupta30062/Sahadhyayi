
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import compression from "vite-plugin-compression";

const CORE_CHUNK_MATCHERS = [
  "/node_modules/react/",
  "/node_modules/react-dom/",
  "/node_modules/react-router-dom/",
  "/node_modules/@radix-ui/react-dialog/",
  "/node_modules/@radix-ui/react-toast/",
  "/node_modules/@tanstack/react-query/",
  "/node_modules/@supabase/",
  "/node_modules/lucide-react/"
];

const FEATURE_CHUNK_PATHS: Record<string, string[]> = {
  socialFeature: [
    "src/pages/SocialMedia.tsx",
    "src/components/social/BookPulseBar.tsx",
    "src/components/social/EnhancedFriendsManager.tsx",
    "src/components/social/EnhancedReadingMap.tsx",
    "src/components/social/EnhancedSocialFeed.tsx",
    "src/components/social/FriendsLocationMap.tsx",
    "src/components/social/ReadingGroups.tsx",
    "src/components/social/SocialSurface.tsx",
    "src/components/social/margins/MarginNotesFeed.tsx",
    "src/components/social/threads/SpoilerThreadsFeed.tsx",
    "src/components/social/rooms/ReadingRoomsPanel.tsx",
    "src/components/social/dna/ReadingDnaPanel.tsx"
  ],
  booksFeature: [
    "src/pages/BookDetails.tsx",
    "src/pages/BookLibrary.tsx",
    "src/pages/Bookshelf.tsx",
    "src/pages/library/index.tsx",
    "src/components/library/BooksCollection.tsx",
    "src/components/books/BookDescription.tsx",
    "src/components/books/BookDetailsHeader.tsx",
    "src/components/books/AuthorBio.tsx",
    "src/components/books/BookReadersConnection.tsx",
    "src/components/books/CreateYourVersionSection.tsx",
    "src/components/books/BookIdeasSection.tsx",
    "src/components/books/BookReader.tsx",
    "src/components/books/BookSocialStrip.tsx",
    "src/components/books/BookEditionTransparency.tsx",
    "src/components/books/BookReviews.tsx",
    "src/hooks/useLibraryBooks.ts",
    "src/hooks/useUserBookshelf.ts",
    "src/hooks/useBookById.ts",
    "src/hooks/useBookRatings.ts"
  ],
  authorsFeature: [
    "src/pages/Authors.tsx",
    "src/pages/AuthorDetails.tsx",
    "src/pages/AuthorProfile.tsx",
    "src/pages/AuthorConnect.tsx",
    "src/pages/authors/[slug].tsx",
    "src/components/authors/ScheduleSessionDialog.tsx",
    "src/components/authors/AuthorGrid.tsx",
    "src/components/authors/AuthorPostCard.tsx",
    "src/components/authors/AuthorProfile.tsx",
    "src/components/authors/AuthorSearch.tsx"
  ],
  publishingFeature: [
    "src/pages/Articles.tsx",
    "src/pages/ArticleDetail.tsx",
    "src/pages/ArticleWrite.tsx",
    "src/pages/MyArticles.tsx",
    "src/pages/MyPublications.tsx",
    "src/pages/PublishBook.tsx",
    "src/pages/Blog.tsx",
    "src/pages/BlogPost.tsx"
  ],
  groupsFeature: [
    "src/pages/ReadingGroups.tsx",
    "src/pages/GroupDetails.tsx",
    "src/components/groups/ReadingGroupsDirectory.tsx"
  ],
  adminFeature: [
    "src/pages/AdminLibraryArchive.tsx",
    "src/pages/AdminLibraryQuality.tsx",
    "src/pages/AdminBookExpertRag.tsx",
    "src/pages/AdminAuthorEnrichment.tsx",
    "src/pages/AdminFeedback.tsx"
  ]
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/",
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:4000',
        changeOrigin: true,
      },
      '/goodreads': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:4000',
        changeOrigin: true,
      },
      '/discussions': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:4000',
        ws: true,
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    compression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
  ].filter(Boolean),
  optimizeDeps: {
    include: [
      '@radix-ui/react-dialog',
      '@radix-ui/react-toast',
      '@tanstack/react-query',
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js'
    ],
    force: true,
    exclude: []
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode),
    global: 'globalThis',
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
  },
  build: {
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    target: 'esnext',
    rollupOptions: {
      output: {
        // Preserve shared framework compression while grouping modules into
        // feature chunks. onlyExplicitManualChunks prevents a shared hook used
        // on another route from dragging its whole feature into that route.
        manualChunks(id) {
          const normalizedId = id.replace(/\\\\/g, "/");

          if (CORE_CHUNK_MATCHERS.some((match) => normalizedId.includes(match))) {
            return "core";
          }

          for (const [chunkName, sourceFiles] of Object.entries(FEATURE_CHUNK_PATHS)) {
            if (sourceFiles.some((sourceFile) => normalizedId.endsWith("/" + sourceFile))) {
              return chunkName;
            }
          }

          return undefined;
        },
        onlyExplicitManualChunks: true
      }
    },
    terserOptions: {
      // All Vite output chunks are ES modules. Let Terser apply module-level
      // dead-code elimination and top-level mangling without unsafe transforms.
      module: true,
      compress: {
        passes: 2,
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      },
      mangle: {
        safari10: true,
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  assetsInclude: ['**/*.webp', '**/*.avif'],
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
}));
