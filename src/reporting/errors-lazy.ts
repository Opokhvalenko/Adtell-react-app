type Extra = Record<string, unknown>;
type Reporter = (err: unknown, extra?: Extra) => void;

let mod: Promise<{ reportError: Reporter }> | null = null;

const load = (): Promise<{ reportError: Reporter }> => {
	if (!mod) {
		mod = import("./errors") as Promise<{ reportError: Reporter }>;
	}
	return mod;
};

export function reportError(err: unknown, extra?: Extra) {
	load().then((m) => m.reportError?.(err, extra));
}

export async function tryOrThrow<T>(
	label: string,
	fn: () => Promise<T>,
): Promise<T> {
	try {
		return await fn();
	} catch (err) {
		reportError(err, { where: label });
		throw err;
	}
}

export function trySyncOrThrow<T>(label: string, fn: () => T): T {
	try {
		return fn();
	} catch (err) {
		reportError(err, { where: label });
		throw err;
	}
}
