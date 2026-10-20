
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import compression from "vite-plugin-compression";

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
        // Keep framework and shared application-shell dependencies together.
        // This allows Brotli to compress repeated runtime helpers across these
        // modules while keeping route-specific features in separate chunks.
        manualChunks: {
          core: [
            'react',
            'react-dom',
            'react-router-dom',
            '@radix-ui/react-dialog',
            '@radix-ui/react-toast',
            '@tanstack/react-query',
            '@supabase/supabase-js',
            'lucide-react'
          ]
        }
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
