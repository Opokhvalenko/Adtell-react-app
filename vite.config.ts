import { defineConfig, type PluginOption, type UserConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import checker from "vite-plugin-checker";
import compression from "vite-plugin-compression";
import inspect from "vite-plugin-inspect";
import { visualizer } from "rollup-plugin-visualizer";
import virtualBuildInfo from "./build/plugins/virtualBuildInfo";

export default defineConfig(({ mode }): UserConfig => {
  const isDev = mode !== "production";
  const isAnalyze = process.env.ANALYZE === "true";
  const isCI = !!process.env.CI;

  return {
    plugins: (
      [
        svgr(),
        react(),

        checker({ typescript: true }),

        // наш окремий модуль-плагін
        virtualBuildInfo(),

        // компресія лише в проді
        !isDev &&
          compression({
            algorithm: "brotliCompress",
            ext: ".br",
            deleteOriginFile: false,
          }),

        // інспектор лише у деві
        isDev && inspect(),

        // аналіз бандла за прапорцем
        isAnalyze &&
          visualizer({
            filename: "stats.html",
            template: "treemap",
            gzipSize: true,
            brotliSize: true,
            open: !isCI, 
          }),
      ].filter(Boolean) as PluginOption[]
    ),

    build: {
      target: "es2022",
      sourcemap: false,
      minify: "terser",
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          // стабільне виділення вендора
          manualChunks: {
            vendor: ["react", "react-dom", "react-router-dom"],
          },
        },
      },
    },

    define: {
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },
  };
});