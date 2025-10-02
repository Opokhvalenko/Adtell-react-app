import { useEffect, useRef } from "react";

export default function CreateAdShadow() {
	const frameRef = useRef<HTMLIFrameElement>(null);

	useEffect(() => {
		const onMessage = (e: MessageEvent) => {
			if (!frameRef.current) return;
			if (
				e.data &&
				e.data.type === "resize" &&
				typeof e.data.height === "number"
			) {
				frameRef.current.style.height = `${Math.max(900, e.data.height)}px`;
			}
		};
		window.addEventListener("message", onMessage);
		return () => window.removeEventListener("message", onMessage);
	}, []);

	const src = `/create`; // ← той самий origin (:5173), Vite проксить на бек

	return (
		<div className="max-w-5xl mx-auto my-6">
			<div className="rounded-xl border bg-white dark:bg-gray-900 overflow-hidden shadow">
				<iframe
					ref={frameRef}
					src={src}
					title="Create Line Item"
					style={{ width: "100%", height: "1200px", border: 0 }}
					sandbox="allow-forms allow-scripts allow-popups allow-downloads"
				/>
			</div>
			<p className="mt-3 text-center text-sm text-slate-500">
				Якщо форма не відображається, відкрий її{" "}
				<a href={src} target="_blank" rel="noreferrer" className="underline">
					у новій вкладці
				</a>
				.
			</p>
		</div>
	);
}
