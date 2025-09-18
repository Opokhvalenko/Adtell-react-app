import type { PluginOption } from "vite";

/**
 * Віртуальний модуль з часом білду:
 *   import { buildTime } from "virtual:build-info"
 */
export default function virtualBuildInfo(): PluginOption {
  const id = "virtual:build-info";
  return {
    name: "virtual-build-info",
    resolveId(source) {
      return source === id ? id : null;
    },
    load(source) {
      if (source === id) {
        return `export const buildTime = ${JSON.stringify(new Date().toISOString())};`;
      }
      return null;
    },
  };
}