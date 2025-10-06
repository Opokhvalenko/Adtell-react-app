export {};

declare global {
	const __BUILD_TIME__: string;

	interface Window {
		pbjs?: unknown;
		googletag?: unknown;

		requestIdleCallback?(
			cb: (deadline: {
				didTimeout: boolean;
				timeRemaining: () => number;
			}) => void,
			opts?: { timeout?: number },
		): number;

		cancelIdleCallback?(id: number): void;
	}
}
