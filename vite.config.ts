import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Keep the production dependency graph intact. The previous manual vendor
// chunks split React and libraries that import React contexts across separate
// chunks, causing production-only initialization crashes before React mounts.
export default defineConfig(({ mode }) => ({
  base: "/",
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api": {
        target: process.env.VITE_BACKEND_URL || "http://localhost:4000",
        changeOrigin: true,
      },
      "/goodreads": {
        target: process.env.VITE_BACKEND_URL || "http://localhost:4000",
        changeOrigin: true,
      },
      "/discussions": {
        target: process.env.VITE_BACKEND_URL || "http://localhost:4000",
        ws: true,
      },
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  optimizeDeps: {
    include: [
      "@radix-ui/react-dialog",
      "@radix-ui/react-toast",
      "@tanstack/react-query",
      "react",
      "react-dom",
      "react-router-dom",
      "@supabase/supabase-js",
    ],
    force: true,
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify(mode),
    global: "globalThis",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
  build: {
    assetsDir: "assets",
    manifest: true,
    sourcemap: false,
    minify: "terser",
    target: "esnext",
    // Let Rollup preserve its module graph rather than forcing framework
    // dependencies into vendor chunks. This avoids circular chunk execution
    // that can access React exports before initialization.
    rollupOptions: {
      output: {
        onlyExplicitManualChunks: false,
      },
    },
    terserOptions: {
      module: true,
      compress: {
        passes: 3,
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ["console.log", "console.info", "console.debug"],
      },
      mangle: {
        safari10: true,
      },
    },
    chunkSizeWarningLimit: 500,
  },
  assetsInclude: ["**/*.webp", "**/*.avif"],
  esbuild: {
    drop: mode === "production" ? ["console", "debugger"] : [],
  },
}));
