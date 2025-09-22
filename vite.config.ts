import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import type { PluginOption, UserConfig } from "vite";
import { defineConfig } from "vite";
import checker from "vite-plugin-checker";
import compression from "vite-plugin-compression";
import inspect from "vite-plugin-inspect";
import svgr from "vite-plugin-svgr";
import virtualBuildInfo from "./build/plugins/virtualBuildInfo";

export default defineConfig(({ mode }): UserConfig => {
	const isDev = mode !== "production";
	const isAnalyze = process.env.ANALYZE === "true";
	const isCI = !!process.env.CI;

	return {
		resolve: {
			alias: {
				"@": fileURLToPath(new URL("./src", import.meta.url)),
			},
		},

		plugins: [
			svgr(),
			react(),
			checker({ typescript: true }),
			virtualBuildInfo(),
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
					open: !isCI,
				}),
		].filter(Boolean) as PluginOption[],

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

		define: { __BUILD_TIME__: JSON.stringify(new Date().toISOString()) },
	};
});
