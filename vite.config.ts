import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import type { PluginOption, UserConfig } from "vite";
import { defineConfig, loadEnv } from "vite";
import checker from "vite-plugin-checker";
import compression from "vite-plugin-compression";
import inspect from "vite-plugin-inspect";
import svgr from "vite-plugin-svgr";
import virtualBuildInfo from "./build/plugins/virtualBuildInfo";

function adsVirtualConfig(env: Record<string, string>): PluginOption {
	return {
		name: "virtual-ads-config",
		resolveId: (id) => (id === "virtual:ads-config" ? id : null),
		load(id) {
			if (id !== "virtual:ads-config") return null;
			const enablePrebid = env.VITE_ENABLE_PREBID === "true";
			const enableGAM = env.VITE_ENABLE_GAM === "true";
			const debug = env.VITE_ADS_DEBUG === "true";
			const enableBidmatic = env.VITE_ENABLE_BIDMATIC === "true";
			const bidmaticSource = Number(env.VITE_BIDMATIC_SOURCE || 0);
			const bidmaticSpn = env.VITE_BIDMATIC_SPN
				? String(env.VITE_BIDMATIC_SPN)
				: "";
			const gamNetworkCalls = env.VITE_GAM_NETWORK === "true";
			return `
        export const ENABLE_PREBID = ${enablePrebid};
        export const ENABLE_GAM = ${enableGAM};
        export const ADS_DEBUG = ${debug};
        export const ENABLE_BIDMATIC = ${enableBidmatic};
        export const BIDMATIC_SOURCE = ${bidmaticSource};
        export const BIDMATIC_SPN = ${JSON.stringify(bidmaticSpn)};
        export const GAM_NETWORK_CALLS = ${gamNetworkCalls};
      `;
		},
	};
}

function adsModulePlugin(env: Record<string, string>): PluginOption {
	return {
		name: "virtual-ads-module",
		resolveId(id) {
			return id === "virtual:ads-module" ? id : null;
		},
		load(id) {
			if (id !== "virtual:ads-module") return null;

			const mode = (env.VITE_ADS_MODULE || "").toLowerCase();
			const root = process.cwd();

			const map: Record<string, string> = {
				prebid: path.resolve(root, "modules/prebid.auction.js"),
				google: path.resolve(root, "modules/google.only.js"),
			};

			const file = map[mode];
			if (!file || !fs.existsSync(file)) {
				return `export async function initAds(){ /* ads disabled */ }`;
			}
			return fs.readFileSync(file, "utf8");
		},
	};
}

export default defineConfig(({ mode }): UserConfig => {
	const env = loadEnv(mode, process.cwd(), "");
	const isDev = mode !== "production";
	const isAnalyze = env.ANALYZE === "true";
	const isCI = !!env.CI;

	return {
		resolve: {
			alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
		},
		plugins: [
			svgr(),
			adsVirtualConfig(env),
			adsModulePlugin(env),
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
