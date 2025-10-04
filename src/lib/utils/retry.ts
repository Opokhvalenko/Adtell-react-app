import pRetry, { type Options as RetryOptions } from "p-retry";

export async function retry<T>(
	runAttempt: (attempt: number) => Promise<T>,
	options: RetryOptions = {},
): Promise<T> {
	return pRetry(runAttempt, {
		retries: 3,
		factor: 2,
		minTimeout: 300,
		maxTimeout: 2000,
		...options,
	});
}

export async function retryEach<T>(
	tasks: Array<() => Promise<T>>,
	options?: RetryOptions,
): Promise<T[]> {
	const results: T[] = [];
	for (const task of tasks) {
		const value = await retry(() => task(), options);
		results.push(value);
	}
	return results;
}
