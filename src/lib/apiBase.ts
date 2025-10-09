export const API_BASE = import.meta.env.DEV
	? ""
	: (
			(import.meta.env.VITE_API_URL as string | undefined) ||
			"https://addtell-backend.onrender.com"
		).replace(/\/$/, "");
