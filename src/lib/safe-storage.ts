type StorageLike = {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
	removeItem(key: string): void;
	clear(): void;
	key(index: number): string | null;
	readonly length: number;
};

function createMemoryStorage(): StorageLike {
	const m = new Map<string, string>();
	return {
		getItem: (k) => m.get(k) ?? null,
		setItem: (k, v) => void m.set(k, String(v)),
		removeItem: (k) => void m.delete(k),
		clear: () => void m.clear(),
		key: (i) => Array.from(m.keys())[i] ?? null,
		get length() {
			return m.size;
		},
	};
}

function probe(kind: "local" | "session"): StorageLike | null {
	if (typeof window === "undefined") return null;
	const s = kind === "local" ? window.localStorage : window.sessionStorage;
	try {
		const k = `__probe__${Math.random()}`;
		s.setItem(k, "1");
		s.removeItem(k);
		return s as StorageLike;
	} catch {
		return null;
	}
}

export const safeLocalStorage: StorageLike =
	probe("local") ?? createMemoryStorage();

export const safeSessionStorage: StorageLike =
	probe("session") ?? createMemoryStorage();

export function getSafeStorage(
	kind: "local" | "session" = "local",
): StorageLike {
	return kind === "local" ? safeLocalStorage : safeSessionStorage;
}
