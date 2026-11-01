import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Keep React and modules that depend on React in Rollup's natural graph.
// Forced vendor chunking caused production-only initialization failures before React mounted.

// Optional bundle diagnostics. Enable with BUNDLE_ANALYSIS_REPORT=1 for CI/local
// investigation; keep the report out of normal production deployments.
function bundleDiagnosticsPlugin(): Plugin {
  return {
    name: "sahadhyayi-bundle-diagnostics",
    apply: "build",
    generateBundle(_options, bundle: Record<string, any>) {
      if (process.env.BUNDLE_ANALYSIS_REPORT !== "1") return;

      const chunks = Object.values(bundle)
        .filter((output: any) => output.type === "chunk")
        .map((chunk: any) => ({
          fileName: chunk.fileName as string,
          rawBytes: Buffer.byteLength(chunk.code as string),
          modules: Object.entries(chunk.modules as Record<string, { renderedLength?: number; originalLength?: number }>)
            .map(([id, details]) => ({
              id: id.replace(process.cwd() + "/", ""),
              renderedBytes: details.renderedLength ?? 0,
              originalBytes: details.originalLength ?? 0,
            }))
            .sort((a, b) => b.renderedBytes - a.renderedBytes)
            .slice(0, 15),
        }))
        .sort((a, b) => b.rawBytes - a.rawBytes);

      console.log("[bundle-analysis] Largest chunks and their top rendered modules:");
      for (const chunk of chunks.slice(0, 10)) {
        console.log(
          `[bundle-analysis] ${chunk.fileName}: ${(chunk.rawBytes / 1000).toFixed(2)} kB raw`
        );
        for (const module of chunk.modules.slice(0, 10)) {
          console.log(
            `[bundle-analysis]   ${(module.renderedBytes / 1000).toFixed(2)} kB: ${module.id}`
          );
        }
      }
      this.emitFile({
        type: "asset",
        fileName: "bundle-analysis.json",
        source: JSON.stringify(chunks, null, 2),
      });
    },
  };
}

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
    bundleDiagnosticsPlugin(),
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
    // Preserve Rollup's natural module graph rather than manually splitting
    // React and its context providers into independently initialized chunks.
    rollupOptions: {
      output: {},
    },
    terserOptions: {
      // Do not enable Terser module-level assumptions for production bundles.
      // The live app has failed before React mounts with a temporal-dead-zone
      // ReferenceError; keep module initialization semantics conservative until
      // the production smoke test confirms the optimized bundle is safe.
      module: false,
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
