const ORIGIN = import.meta.env.DEV
  ? (import.meta.env.VITE_DEV_API_ORIGIN as string | undefined) ?? ""
  : ((import.meta.env.VITE_API_URL as string | undefined) ??
     "https://addtell-backend.onrender.com"   
    ).replace(/\/$/, "");

export const API_BASE = ORIGIN ? `${ORIGIN}/api` : "/api";