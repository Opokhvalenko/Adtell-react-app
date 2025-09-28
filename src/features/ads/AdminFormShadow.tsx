import { useEffect, useRef } from "react";

export default function AdminFormShadow() {
	const hostRef = useRef<HTMLDivElement>(null);
	const url = (import.meta.env.VITE_ADSERVER_URL as string) || "";

	useEffect(() => {
		(async () => {
			if (!hostRef.current || !url) return;

			const root = hostRef.current.attachShadow({ mode: "open" });

			const style = document.createElement("style");
			style.textContent = `
      :host { all: initial; }
      * { box-sizing: border-box; font-family: system-ui, -apple-system, Segoe UI, Roboto, "Open Sans", sans-serif; }
      .wrap { display:block; }
    `;
			root.appendChild(style);

			const html = await fetch(
				`${url.replace(/\/$/, "")}/admin/ads/pages/create-lineitem`,
				{ credentials: "include" },
			).then((r) => r.text());

			const parser = new DOMParser();
			const doc = parser.parseFromString(html, "text/html");
			const form = doc.querySelector("form");
			if (!form) {
				root.append("Failed to load admin form.");
				return;
			}

			form.action = `${url.replace(/\/$/, "")}/admin/ads/lineitems`;

			const wrap = document.createElement("div");
			wrap.className = "wrap";
			wrap.appendChild(form);
			root.appendChild(wrap);
		})();
	}, []);

	return <div ref={hostRef} className="max-w-3xl mx-auto my-6" />;
}
