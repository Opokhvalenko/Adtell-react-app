import { afterEach, describe, expect, it, vi } from "vitest";

type FakePbjs = {
	libLoaded?: boolean;
	que: { push: (fn: () => void) => void };
	setConfig: () => void;
};

/** A Prebid stand-in whose queue runs callbacks at once, like a loaded Prebid does. */
function fakePbjs(libLoaded: boolean): FakePbjs {
	return { libLoaded, que: { push: (fn) => fn() }, setConfig: vi.fn() };
}

const prebidScripts = () =>
	[...document.querySelectorAll("script")].filter((s) => /prebid/i.test(s.src));

/** A fresh module per test: it keeps the loading state in module scope. */
async function loadModule() {
	vi.resetModules();
	return import("../../../modules/prebid.auction.js");
}

describe("Prebid loading", () => {
	afterEach(() => {
		for (const s of prebidScripts()) s.remove();
		Reflect.deleteProperty(window, "pbjs");
	});

	it("uses the build index.html already loaded instead of fetching another copy", async () => {
		Object.assign(window, { pbjs: fakePbjs(true) });
		const { ensurePrebid } = await loadModule();
		await ensurePrebid();
		expect(prebidScripts()).toHaveLength(0);
	});

	it("otherwise loads only our own build from this origin, never a CDN", async () => {
		Object.assign(window, { pbjs: fakePbjs(false) });
		const { ensurePrebid } = await loadModule();
		const ready = ensurePrebid();
		const [script] = prebidScripts();
		expect(new URL(script.src).pathname).toBe("/prebid/prebid.js");
		expect(new URL(script.src).origin).toBe(location.origin);
		script.dispatchEvent(new Event("load"));
		await ready;
		expect(prebidScripts()).toHaveLength(1);
	});
});
