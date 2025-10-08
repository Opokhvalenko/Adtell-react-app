const API_BASE = (
	(import.meta.env.VITE_API_URL as string | undefined) ||
	"http://localhost:3000"
).replace(/\/$/, "");

export { API_BASE };
