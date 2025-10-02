const API_BASE = import.meta.env.DEV
	? ""
	: (
			(import.meta.env.VITE_API_URL as string | undefined) ||
			"http://127.0.0.1:3000"
		).replace(/\/$/, "");

export { API_BASE };
