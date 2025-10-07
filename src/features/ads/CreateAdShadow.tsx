import { useEffect, useRef } from "react";

type ResizeMsg = { type: "resize"; height: number };

function isResizeMsg(d: unknown): d is ResizeMsg {
	return (
		typeof d === "object" &&
		d !== null &&
		(d as { type?: unknown }).type === "resize" &&
		typeof (d as { height?: unknown }).height === "number"
	);
}

export default function CreateAdShadow() {
	const frameRef = useRef<HTMLIFrameElement>(null);

	useEffect(() => {
		const onMessage = (e: MessageEvent<unknown>) => {
			const win = frameRef.current?.contentWindow;
			if (!win || e.source !== win) return;

			if (!(e.origin === "null" || e.origin === window.location.origin)) return;
			if (!isResizeMsg(e.data)) return;

			if (frameRef.current) {
				frameRef.current.style.height = `${Math.max(900, e.data.height)}px`;
			}
		};
		window.addEventListener("message", onMessage);
		return () => window.removeEventListener("message", onMessage);
	}, []);

	const _src = "/create-lineitem";

	return (
		<div className="max-w-6xl mx-auto p-6 space-y-8">
			<div className="text-center py-8">
				<div className="inline-flex items-center gap-4 mb-4">
					<div className="w-16 h-16 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
						<span className="text-white text-2xl">✨</span>
					</div>
					<div className="text-left">
						<h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 dark:from-gray-100 dark:via-blue-100 dark:to-purple-100 bg-clip-text text-transparent">
							Create Advertisement
						</h1>
						<p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
							Design and configure your advertising campaigns
						</p>
					</div>
				</div>
			</div>

			<div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden shadow-xl">
				<iframe
					ref={frameRef}
					src="/create-lineitem"
					title="Create Line Item"
					style={{ width: "100%", height: "1200px", border: 0 }}
					sandbox="allow-scripts allow-forms allow-popups allow-modals"
					referrerPolicy="no-referrer"
					loading="lazy"
				/>
			</div>

			<p className="mt-3 text-center text-sm text-slate-500">
				Якщо форма не відображається, відкрий її{" "}
				<a
					href="/create-lineitem"
					target="_blank"
					rel="noreferrer"
					className="underline"
				>
					у новій вкладці
				</a>
				.
			</p>
		</div>
	);
}
