// src/features/ads/AdminFormShadow.tsx
import { useEffect, useRef } from "react";

export default function AdminFormShadow() {
	const hostRef = useRef<HTMLDivElement>(null);

	const base = ((import.meta.env.VITE_ADSERVER_URL as string) || "").replace(
		/\/$/,
		"",
	);

	const token = (import.meta.env.VITE_ADMIN_TOKEN as string) || "change-me";

	useEffect(() => {
		(async () => {
			if (!hostRef.current || !base) return;

			const root = hostRef.current.attachShadow({ mode: "open" });

			const html = await fetch(`${base}/admin/ads/form`, {
				credentials: "include",
				headers: { "x-admin-token": token },
			}).then((r) => r.text());

			const doc = new DOMParser().parseFromString(html, "text/html");
			const form = doc.querySelector("form");
			if (!form) {
				root.append("Failed to load admin form.");
				return;
			}

			form.action = `${base}/admin/ads/lineitems`;

			if (!form.querySelector('input[name="__admin_token"]')) {
				const hidden = doc.createElement("input");
				hidden.type = "hidden";
				hidden.name = "__admin_token";
				hidden.value = token;
				form.appendChild(hidden);
			}

			const style = doc.createElement("style");
			style.textContent = `
        :host { all: initial; }
        * { box-sizing: border-box; font-family: system-ui, -apple-system, Segoe UI, Roboto, "Open Sans", sans-serif; }
        .wrap { display: block; }
      `;

			const wrap = doc.createElement("div");
			wrap.className = "wrap";
			wrap.appendChild(form);

			root.append(style, wrap);
		})();
	}, []);

	return <div ref={hostRef} className="max-w-3xl mx-auto my-6" />;
}
