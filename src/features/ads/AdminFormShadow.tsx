import { useEffect, useRef } from "react";

export default function AdminFormShadow() {
	const hostRef = useRef<HTMLDivElement>(null);
	const url = (import.meta.env.VITE_ADSERVER_URL as string) || "";

	useEffect(() => {
		(async () => {
			if (!hostRef.current || !url) return;
			const root = hostRef.current.attachShadow({ mode: "open" });
			const wrapper = document.createElement("iframe");
			wrapper.src = `${url}/admin/ads/pages/create-lineitem`;
			wrapper.width = "100%";
			wrapper.height = "700";
			wrapper.style.border = "0";
			root.appendChild(wrapper);
		})();
	}, []);

	return <div ref={hostRef} className="max-w-3xl mx-auto my-6" />;
}
