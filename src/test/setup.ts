import "@testing-library/jest-dom";
import { vi } from "vitest";

// jsdom не має matchMedia — додаємо мок
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

// (опційно) якщо десь використаєш ці API — не падатиме
class MockResizeObserver {
	observe() {}
	unobserve() {}
	disconnect() {}
}
Object.defineProperty(window, "ResizeObserver", {
	writable: true,
	value: MockResizeObserver,
});
