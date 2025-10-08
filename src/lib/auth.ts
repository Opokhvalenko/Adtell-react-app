import { API_BASE } from "./apiBase";

async function jsonOrText(res: Response) {
  const ct = res.headers.get("content-type") || "";
  const raw = await res.text();
  if (ct.includes("application/json")) { try { return JSON.parse(raw); } catch {} }
  return raw;
}

export async function apiLogin(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {    
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  const data = await jsonOrText(res);
  if (!res.ok) throw typeof data === "string" ? new Error(data) : data;
  return data;
}

export async function apiRegister(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/register`, { 
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  const data = await jsonOrText(res);
  if (!res.ok) throw typeof data === "string" ? new Error(data) : data;
  return data;
}