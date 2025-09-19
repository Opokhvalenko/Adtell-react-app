import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// matchMedia (jsdom не має)
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

// ResizeObserver (опційно)
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
