import { API_BASE } from "./apiBase";

export async function apiLogin(email: string, password: string) {
	const res = await fetch(`${API_BASE}/auth/login`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		credentials: "include",
		body: JSON.stringify({ email, password }),
	});
	const txt = await res.text();
	const data = (res.headers.get("content-type") || "").includes("json")
		? JSON.parse(txt)
		: txt;
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
	const txt = await res.text();
	const data = (res.headers.get("content-type") || "").includes("json")
		? JSON.parse(txt)
		: txt;
	if (!res.ok) throw typeof data === "string" ? new Error(data) : data;
	return data;
}
