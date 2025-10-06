// vite.config.ts
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, URL } from "node:url";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import type { PluginOption, UserConfig } from "vite";
import { defineConfig, loadEnv } from "vite";
import checker from "vite-plugin-checker";
import compression from "vite-plugin-compression";
import inspect from "vite-plugin-inspect";
import svgr from "vite-plugin-svgr";

/* ───────────────────────── virtual:ads-config ────────────────────────── */
function adsVirtualConfig(env: Record<string, string>): PluginOption {
	return {
		name: "virtual-ads-config",
		resolveId: (id) => (id === "virtual:ads-config" ? id : null),
		load(id) {
			if (id !== "virtual:ads-config") return null;
			const b = (v?: string) => String(v) === "true";
			const n = (v?: string, d = 0) => Number(v ?? d);
			return `
        export const ENABLE_PREBID = ${b(env.VITE_ENABLE_PREBID)};
        export const ENABLE_GAM = ${b(env.VITE_ENABLE_GAM)};
        export const ADS_DEBUG = ${b(env.VITE_ADS_DEBUG)};
        export const ENABLE_BIDMATIC = ${b(env.VITE_ENABLE_BIDMATIC)};
        export const BIDMATIC_SOURCE = ${n(env.VITE_BIDMATIC_SOURCE)};
        export const BIDMATIC_SPN = ${JSON.stringify(env.VITE_BIDMATIC_SPN ?? "")};
        export const ENABLE_ADTELLIGENT = ${b(env.VITE_ENABLE_ADTELLIGENT)};
        export const ADTELLIGENT_AID = ${n(env.VITE_ADTELLIGENT_AID)};
        export const GAM_NETWORK_CALLS = ${b(env.VITE_GAM_NETWORK)};
        export const ENABLE_REPORTING = ${b(env.VITE_ENABLE_REPORTING)};
      `.trim();
		},
	};
}

/* ──────────────────────── virtual:ads-analytics ──────────────────────── */
function analyticsModulePlugin(env: Record<string, string>): PluginOption {
	return {
		name: "virtual-ads-analytics",
		resolveId: (id) => (id === "virtual:ads-analytics" ? id : null),
		load(id) {
			if (id !== "virtual:ads-analytics") return null;

			const enabled = String(env.VITE_ENABLE_REPORTING || "false") === "true";
			if (!enabled) return `export async function initAnalytics() {}`;
			const file = path.resolve(process.cwd(), "modules/analytics.module.js");
			if (!fs.existsSync(file)) {
				throw new Error(`[virtual-ads-analytics] File not found: ${file}`);
			}
			return `export { initAnalytics } from "/modules/analytics.module.js";`;
		},
	};
}

/* ────────────────────────── virtual:ads-module ───────────────────────── */
function adsModulePlugin(env: Record<string, string>): PluginOption {
	return {
		name: "virtual-ads-module",
		resolveId: (id) => (id === "virtual:ads-module" ? id : null),
		load(id) {
			if (id !== "virtual:ads-module") return null;

			const mode = String(env.VITE_ADS_MODULE || "").toLowerCase();
			const root = process.cwd();
			const map: Record<string, string> = {
				prebid: path.resolve(root, "modules/prebid.auction.js"),
				google: path.resolve(root, "modules/google.only.js"),
			};
			const file = map[mode];
			if (!file) return `export async function initAds(){}`;
			if (!fs.existsSync(file)) {
				throw new Error(`[virtual-ads-module] File not found: ${file}`);
			}
			return fs.readFileSync(file, "utf8");
		},
	};
}

/* ───────────────────────── virtual:ads-bridge ────────────────────────── */
function adsBridgePlugin(): PluginOption {
	return {
		name: "virtual-ads-bridge",
		resolveId: (id) => (id === "virtual:ads-bridge" ? id : null),
		load(id) {
			if (id !== "virtual:ads-bridge") return null;
			return `
        (function () {
          const w = window;
          w.__ads = w.__ads || {};
          const bind = (name) => {
            w.__ads[name] = async (...args) => {
              const m = await import('virtual:ads-module');
              const fn = m[name];
              if (typeof fn === 'function') return fn(...args);
            };
          };
          ["initAds","requestAndDisplay","refreshAds","mount","unmount"].forEach(bind);
        })();
        export default undefined;
      `;
		},
	};
}

/* ──────────────────────── virtual:build-info ─────────────────────────── */
function virtualBuildInfo(): PluginOption {
	return {
		name: "virtual-build-info",
		resolveId: (id) => (id === "virtual:build-info" ? id : null),
		load(id) {
			if (id !== "virtual:build-info") return null;
			const iso = new Date().toISOString();
			return `export const buildTime = ${JSON.stringify(iso)};`;
		},
	};
}

/* ────────────────────────────── Vite config ───────────────────────────── */
export default defineConfig(({ mode }): UserConfig => {
	const env = loadEnv(mode, process.cwd(), "");
	const isDev = mode !== "production";
	const isAnalyze = env.ANALYZE === "true";
	const isCI = !!env.CI;

	const API_TARGET = env.VITE_API_TARGET || "http://localhost:3000";

	const enableSentry = !!env.VITE_SENTRY_DSN;
	const uploadSourcemaps =
		enableSentry && mode === "production" && env.SENTRY_UPLOAD === "true";

	const releaseName =
		env.SENTRY_RELEASE || env.GITHUB_SHA || `build-${Date.now()}`;

	return {
		envPrefix: "VITE_",

		resolve: {
			alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
		},

		server: {
			port: Number(env.VITE_DEV_PORT || 5173),
			strictPort: true,
			proxy: {
				"/api/report": {
					target: API_TARGET,
					changeOrigin: true,
					rewrite: (path) =>
						path.replace(/^\/api\/report/, "/api/analytics/events"),
				},
				"/analytics": {
					target: API_TARGET,
					changeOrigin: true,
					rewrite: (path) => path.replace(/^\/analytics/, "/api/analytics"),
				},
				"/api": { target: API_TARGET, changeOrigin: true },
				"/feed": {
					target: API_TARGET,
					changeOrigin: true,
					rewrite: (path) => path.replace(/^\/feed/, "/api/feed"),
				},
				"/article": {
					target: API_TARGET,
					changeOrigin: true,
					rewrite: (path) => path.replace(/^\/article/, "/api/article"),
				},
				"/auth": {
					target: API_TARGET,
					changeOrigin: true,
					rewrite: (path) => path.replace(/^\/auth/, "/api/auth"),
				},
				"/upload": {
					target: API_TARGET,
					changeOrigin: true,
					rewrite: (path) => path.replace(/^\/upload/, "/api/upload"),
				},
				"/adserver": {
					target: API_TARGET,
					changeOrigin: true,
					rewrite: (path) => path.replace(/^\/adserver/, "/api"),
				},
				"/api/bid": { target: API_TARGET, changeOrigin: true },
				"/docs": { target: API_TARGET, changeOrigin: true },
				"/uploads": { target: API_TARGET, changeOrigin: true },
				"/create-lineitem": { target: API_TARGET, changeOrigin: true },
				"/create": {
					target: API_TARGET,
					changeOrigin: true,
					rewrite: (path) => path.replace(/^\/create/, "/api/create"),
				},
				"/ads": {
					target: API_TARGET,
					changeOrigin: true,
					rewrite: (path) => path.replace(/^\/ads/, "/api/ads"),
				},
			},
		},

		plugins: [
			svgr(),
			adsVirtualConfig(env),
			adsModulePlugin(env),
			analyticsModulePlugin(env),
			adsBridgePlugin(),
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
			uploadSourcemaps &&
				sentryVitePlugin({
					org: env.SENTRY_ORG,
					project: env.SENTRY_PROJECT,
					authToken: env.SENTRY_AUTH_TOKEN,
					release: { name: releaseName },
					sourcemaps: { assets: "./dist/**" },
				}),
		].filter(Boolean) as PluginOption[],

		build: {
			target: "es2022",
			sourcemap: enableSentry ? "hidden" : false,
			minify: "terser",
			chunkSizeWarningLimit: 1000,
			rollupOptions: {
				output: {
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
