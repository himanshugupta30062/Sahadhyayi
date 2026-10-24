
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

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
    manifest: true,
    sourcemap: false,
    minify: 'terser',
    target: 'esnext',
    // Keep routing/features in Rollup's default chunks. Only consolidate stable
    // framework dependencies, matching the former conservative chunk layout.
    rollupOptions: {
      output: {
        // Keep expensive, rarely co-used dependencies out of the initial route.
        // This only changes chunk boundaries; application modules and features stay intact.
        manualChunks(id) {
          if (!id.includes('/node_modules/')) return;
          if (/\/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'vendor-react';
          if (/\/node_modules\/(react-router|react-router-dom|@remix-run)\//.test(id)) return 'vendor-router';
          if (/\/node_modules\/@supabase\//.test(id) || /\/node_modules\/@tanstack\//.test(id)) return 'vendor-data';
          if (/\/node_modules\/lucide-react\//.test(id)) return 'vendor-icons';
          if (/\/node_modules\/framer-motion\//.test(id)) return 'vendor-motion';
          if (/\/node_modules\/recharts\//.test(id) || /\/node_modules\/d3-[^/]+\//.test(id)) return 'vendor-charts';
          if (/\/node_modules\/@react-google-maps\//.test(id) || /\/node_modules\/google-map-react\//.test(id)) return 'vendor-maps';
          if (/\/node_modules\/@radix-ui\//.test(id)) return 'vendor-radix';
        },
      },
    },
    // Warn early when a generated chunk grows large; size-limit separately enforces compressed budgets.
    // Feature and vendor chunks are split to reduce initial-route JavaScript without removing features.
    terserOptions: {
      module: true,
      compress: {
        // Extra safe pass targets the remaining shared helpers without enabling
        // unsafe transforms or changing route-level chunk boundaries.
        passes: 3,
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
      mangle: {
        safari10: true,
      },
    },
    chunkSizeWarningLimit: 500,
  },
  assetsInclude: ['**/*.webp', '**/*.avif'],
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
}));
