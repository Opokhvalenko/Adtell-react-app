import "@testing-library/jest-dom/vitest";

/**
 * Lightweight polyfills for the test (jsdom) environment.
 * No `any` is used; all types are strictly defined.
 */

//
// IntersectionObserver
//
class MockIntersectionObserver implements IntersectionObserver {
	readonly root: Element | Document | null = null;
	readonly rootMargin = "0px";
	readonly thresholds: ReadonlyArray<number> = [];

	// keep constructor signature parity with the real API
	constructor(
		_callback: IntersectionObserverCallback,
		_options?: IntersectionObserverInit,
	) {
		// mark params as used to avoid "noUselessConstructor"
		void _callback;
		void _options;
	}

	observe(_target: Element): void {
		void _target;
	}
	unobserve(_target: Element): void {
		void _target;
	}
	disconnect(): void {}
	takeRecords(): IntersectionObserverEntry[] {
		return [];
	}
}

//
// ResizeObserver (only if missing in jsdom)
//
class MockResizeObserver implements ResizeObserver {
	constructor(_callback: ResizeObserverCallback) {
		void _callback;
	}
	observe(_target: Element): void {
		void _target;
	}
	unobserve(_target: Element): void {
		void _target;
	}
	disconnect(): void {}
}

//
// matchMedia (only if missing)
//
function mockMatchMedia(query: string): MediaQueryList {
	const mql: MediaQueryList = {
		matches: false,
		media: query,
		onchange: null,
		// legacy
		addListener() {}, // deprecated but present in types
		removeListener() {}, // deprecated but present in types
		// modern
		addEventListener() {},
		removeEventListener() {},
		dispatchEvent(): boolean {
			return false;
		},
	};
	return mql;
}

//
// Apply polyfills to the global test environment
//
const g = globalThis as Window & typeof globalThis;

g.IntersectionObserver = MockIntersectionObserver;

// jsdom may not provide ResizeObserver
if (typeof g.ResizeObserver === "undefined") {
	g.ResizeObserver = MockResizeObserver;
}

// jsdom may not provide matchMedia
if (typeof g.matchMedia === "undefined") {
	g.matchMedia = mockMatchMedia;
}
