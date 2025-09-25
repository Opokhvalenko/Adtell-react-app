import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// matchMedia
if (!("matchMedia" in window)) {
	Object.defineProperty(window, "matchMedia", {
		writable: true,
		value: vi.fn().mockImplementation((query: string) => ({
			matches: false,
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		})),
	});
}

// ResizeObserver
if (!("ResizeObserver" in window)) {
	class MockResizeObserver {
		observe() {}
		unobserve() {}
		disconnect() {}
	}
	Object.defineProperty(window, "ResizeObserver", {
		writable: true,
		value: MockResizeObserver,
	});
}

declare global {
	interface Window {
		pbjs?: unknown;
		googletag?: unknown;
	}
}

// Prebid mock
window.pbjs = window.pbjs ?? {
	que: [] as Array<() => void>,
	onEvent: vi.fn(),
	setConfig: vi.fn(),
	addAdUnits: vi.fn(),
	requestBids: vi.fn(),
	getHighestCpmBids: vi.fn(() => [] as unknown[]),
	renderAd: vi.fn(),
	setTargetingForGPTAsync: vi.fn(),
};

// GPT mock
window.googletag = window.googletag ?? {
	cmd: [] as Array<() => void>,
	apiReady: false,
	pubads: vi.fn(() => ({
		refresh: vi.fn(),
		disableInitialLoad: vi.fn(),
		enableSingleRequest: vi.fn(),
		setCentering: vi.fn(),
		collapseEmptyDivs: vi.fn(),
		addEventListener: vi.fn(),
		getSlots: vi.fn(() => [] as Array<{ getSlotElementId: () => string }>),
	})),
	enableServices: vi.fn(),
	defineSlot: vi.fn(() => ({
		addService: vi.fn(),
		getSlotElementId: vi.fn(() => ""),
	})),
	display: vi.fn(),
};
