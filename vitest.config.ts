import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
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
