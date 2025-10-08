import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),

			"virtual:ads-config": fileURLToPath(
				new URL("./src/test/mocks/virtual-ads-config.ts", import.meta.url),
			),
			"virtual:ads-module": fileURLToPath(
				new URL("./src/test/mocks/virtual-ads-module.ts", import.meta.url),
			),
			"virtual:build-info": fileURLToPath(
				new URL("./src/test/mocks/virtual-build-info.ts", import.meta.url),
			),
			"virtual:ads-bridge": fileURLToPath(
				new URL("./src/test/mocks/virtual-ads-bridge.ts", import.meta.url),
			),
			"virtual:ads-analytics": fileURLToPath(
				new URL("./src/test/mocks/virtual-ads-analytics.ts", import.meta.url),
			),
		},
	},
	plugins: [react()],
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
