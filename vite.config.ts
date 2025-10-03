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

// ---------- virtual:ads-config ----------
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
			const enableReporting = env.VITE_ENABLE_REPORTING === "true";
			return `
        export const ENABLE_PREBID = ${enablePrebid};
        export const ENABLE_GAM = ${enableGAM};
        export const ADS_DEBUG = ${debug};
        export const ENABLE_BIDMATIC = ${enableBidmatic};
        export const BIDMATIC_SOURCE = ${bidmaticSource};
        export const BIDMATIC_SPN = ${JSON.stringify(bidmaticSpn)};
        export const GAM_NETWORK_CALLS = ${gamNetworkCalls};
		export const ENABLE_REPORTING = ${enableReporting};
      `;
		},
	};
}

// ---------- virtual:ads-analytics ----------
function analyticsModulePlugin(envVars: Record<string, string>): PluginOption {
	return {
		name: "virtual-ads-analytics",
		resolveId: (id) => (id === "virtual:ads-analytics" ? id : null),
		load(id) {
			if (id !== "virtual:ads-analytics") return null;

			const enabled =
				String(envVars.VITE_ENABLE_REPORTING || "false") === "true";
			if (!enabled)
				return `export async function initAnalytics(){ /* disabled */ }`;

			const rootDir = process.cwd();
			const file = path.resolve(rootDir, "modules/analytics.module.js");
			if (!fs.existsSync(file)) {
				// даємо читабельну помилку під час білду
				throw new Error(`[virtual-ads-analytics] File not found: ${file}`);
			}
			// делегуємо реальну імплементацію в /modules
			return `export { initAnalytics } from "/modules/analytics.module.js";`;
		},
	};
}

// ---------- virtual:ads-module ----------
function adsModulePlugin(envVars: Record<string, string>): PluginOption {
	return {
		name: "virtual-ads-module",
		resolveId: (id) => (id === "virtual:ads-module" ? id : null),
		load(id) {
			if (id !== "virtual:ads-module") return null;

			const mode = String(envVars.VITE_ADS_MODULE || "").toLowerCase();
			const rootDir = process.cwd();

			const moduleMap: Record<string, string> = {
				prebid: path.resolve(rootDir, "modules/prebid.auction.js"),
				google: path.resolve(rootDir, "modules/google.only.js"),
			};

			const moduleFilePath = moduleMap[mode];
			if (!moduleFilePath) {
				return `export async function initAds(){ /* ads disabled: unknown mode "${mode}" */ }`;
			}
			try {
				if (!fs.existsSync(moduleFilePath)) {
					throw new Error(`File not found: ${moduleFilePath}`);
				}
				return fs.readFileSync(moduleFilePath, "utf8");
			} catch (err) {
				throw new Error(`[virtual-ads-module] ${String(err)}`);
			}
		},
	};
}

export default defineConfig(({ mode }): UserConfig => {
	const env = loadEnv(mode, process.cwd(), "");
	const isDev = mode !== "production";
	const isAnalyze = env.ANALYZE === "true";
	const isCI = !!env.CI;

	const API_TARGET = env.VITE_API_TARGET || "http://127.0.0.1:3000";

	return {
		resolve: {
			alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
		},

		server: {
			port: Number(env.VITE_DEV_PORT || 5173),
			proxy: {
				"/feed": { target: API_TARGET, changeOrigin: true },
				"/article": { target: API_TARGET, changeOrigin: true },
				"/auth": { target: API_TARGET, changeOrigin: true },
				"/upload": { target: API_TARGET, changeOrigin: true },
				"/adserver": { target: API_TARGET, changeOrigin: true },
				"/docs": { target: API_TARGET, changeOrigin: true },
				"/uploads": { target: API_TARGET, changeOrigin: true },
				"/create": { target: API_TARGET, changeOrigin: true },
				"/ads": { target: API_TARGET, changeOrigin: true },
				"/api": { target: API_TARGET, changeOrigin: true },
			},
		},

		plugins: [
			svgr(),
			adsVirtualConfig(env),
			adsModulePlugin(env),
			analyticsModulePlugin(env),
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
