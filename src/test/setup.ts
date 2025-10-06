import { vi } from "vitest";
import "@testing-library/jest-dom";

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation((_callback) => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn(),
}));

// Mock window.__ads
Object.defineProperty(window, "__ads", {
	value: {
		mount: vi.fn(),
		unmount: vi.fn(),
		uid: "test-uid-123",
	},
	writable: true,
});

// Mock window.pbjs
Object.defineProperty(window, "pbjs", {
	value: {
		onEvent: vi.fn(),
		getHighestCpmBids: vi.fn(),
		setConfig: vi.fn(),
		addAdUnits: vi.fn(),
		requestBids: vi.fn(),
		renderAd: vi.fn(),
		getBidResponses: vi.fn(),
		getAuctionData: vi.fn(),
		registerBidder: vi.fn(),
	},
	writable: true,
});

// Mock fetch
global.fetch = vi.fn();

// Mock console methods to reduce noise in tests
global.console = {
	...console,
	log: vi.fn(),
	error: vi.fn(),
	warn: vi.fn(),
	info: vi.fn(),
};
