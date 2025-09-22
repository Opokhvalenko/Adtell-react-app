export type CookieOptions = {
	days?: number;
	expires?: Date;
	path?: string;
	domain?: string;
	sameSite?: "lax" | "strict" | "none";
	secure?: boolean;
};

const hasCookieStore =
	typeof window !== "undefined" &&
	"cookieStore" in window &&
	!!window.cookieStore;

export async function setCookie(
	name: string,
	value: string,
	opts: CookieOptions = {},
): Promise<void> {
	if (typeof document === "undefined") return;

	const path = opts.path ?? "/";
	const sameSite = opts.sameSite ?? "lax";
	const secure =
		typeof window !== "undefined"
			? (opts.secure ?? window.location.protocol === "https:")
			: opts.secure;

	const expiresDate =
		opts.expires ??
		(opts.days ? new Date(Date.now() + opts.days * 86_400_000) : undefined);

	if (hasCookieStore && window.cookieStore) {
		await window.cookieStore.set({
			name,
			value,
			path,
			domain: opts.domain,
			sameSite,
			expires: expiresDate?.getTime(),
		});
		return;
	}

	const sameSiteHeader = (sameSite.charAt(0).toUpperCase() +
		sameSite.slice(1)) as "Lax" | "Strict" | "None";

	const parts: string[] = [];
	parts.push(`${encodeURIComponent(name)}=${encodeURIComponent(value)}`);
	parts.push(`Path=${path}`);
	if (opts.domain) parts.push(`Domain=${opts.domain}`);
	if (secure) parts.push("Secure");
	parts.push(`SameSite=${sameSiteHeader}`);
	if (expiresDate) parts.push(`Expires=${expiresDate.toUTCString()}`);

	// biome-ignore lint/suspicious/noDocumentCookie: fallback when Cookie Store API is unavailable
	document.cookie = parts.join("; ");
}

export async function getCookie(name: string): Promise<string | undefined> {
	if (typeof document === "undefined") return undefined;

	if (hasCookieStore && window.cookieStore) {
		const c = await window.cookieStore.get(name);
		return c?.value ?? undefined;
	}

	const key = `${encodeURIComponent(name)}=`;
	for (const pair of document.cookie.split("; ")) {
		if (pair.startsWith(key)) return decodeURIComponent(pair.slice(key.length));
	}
	return undefined;
}

export async function deleteCookie(
	name: string,
	path: string = "/",
): Promise<void> {
	if (typeof document === "undefined") return;

	if (hasCookieStore && window.cookieStore) {
		await window.cookieStore.delete({ name, path });
		return;
	}

	// biome-ignore lint/suspicious/noDocumentCookie: fallback when Cookie Store API is unavailable
	document.cookie = `${encodeURIComponent(name)}=; Path=${path}; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}
