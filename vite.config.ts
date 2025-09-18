import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import type { PluginOption } from "vite";
import checker from "vite-plugin-checker";
import compression from "vite-plugin-compression";
import inspect from "vite-plugin-inspect";
import svgr from "vite-plugin-svgr";
import { defineConfig } from "vitest/config";

const isDev = process.env.NODE_ENV !== "production";
const isAnalyze = !!process.env.ANALYZE;

function buildInfoVirtual(): PluginOption {
  const id = "virtual:build-info";
  return {
    name: "virtual-build-info",
    resolveId: (source) => (source === id ? id : null),
    load: (source) =>
      source === id
        ? `export const buildTime = ${JSON.stringify(new Date().toISOString())};`
        : null,
  };
}

export default defineConfig({
  plugins: [
    react(),
    svgr(),
    checker({ typescript: true }),
    buildInfoVirtual(),
    !isDev &&
      compression({
        algorithm: "brotliCompress",
        ext: ".br",
        deleteOriginFile: false,
      }),
    isDev && inspect(),
    isAnalyze &&
      visualizer({
        filename: "stats.html",
        template: "treemap",
        gzipSize: true,
        brotliSize: true,
        open: true,
      }),
  ].filter(Boolean) as PluginOption[],

  server: { port: 5173, open: true, strictPort: true },
  preview: { port: 5173, open: true, strictPort: true },

  build: {
    target: "es2022",
    sourcemap: false,
    minify: "terser",
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: { vendor: ["react", "react-dom", "react-router-dom"] },
      },
    },
  },

  esbuild: { target: "es2022" },

  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },

  // Vitest
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "src/test/setup.ts",
    include: ["**/*.{test,spec}.{ts,tsx,js,jsx}"],
    passWithNoTests: true,
    watch: false,
    reporters: "dot",
  },
});