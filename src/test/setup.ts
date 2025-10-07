import "@testing-library/jest-dom/vitest";

class MockIntersectionObserver implements IntersectionObserver {
	readonly root: Element | Document | null = null;
	readonly rootMargin = "0px";
	readonly thresholds: ReadonlyArray<number> = [];

	constructor(
		_callback: IntersectionObserverCallback,
		_options?: IntersectionObserverInit,
	) {
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

function mockMatchMedia(query: string): MediaQueryList {
	const mql: MediaQueryList = {
		matches: false,
		media: query,
		onchange: null,
		addListener() {},
		removeListener() {},
		addEventListener() {},
		removeEventListener() {},
		dispatchEvent(): boolean {
			return false;
		},
	};
	return mql;
}

const g = globalThis as Window & typeof globalThis;

g.IntersectionObserver = MockIntersectionObserver;

if (typeof g.ResizeObserver === "undefined") {
	g.ResizeObserver = MockResizeObserver;
}

if (typeof g.matchMedia === "undefined") {
	g.matchMedia = mockMatchMedia;
}
