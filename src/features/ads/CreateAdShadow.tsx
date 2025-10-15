import { useEffect, useRef, useState } from "react";
import { API_ORIGIN } from "@/lib/apiBase";

const src = import.meta.env.DEV
	? "/create-lineitem"
	: `${API_ORIGIN}/create-lineitem`;

type ResizeMsg = { type: "resize"; height: number };
type IframeMsg = ResizeMsg | { type: "ack" } | { type: "ready" };

function isResizeMsg(d: unknown): d is ResizeMsg {
	if (typeof d !== "object" || d === null) return false;
	const obj = d as Record<string, unknown>;
	return obj.type === "resize" && typeof obj.height === "number";
}

export default function CreateAdShadow() {
	const frameRef = useRef<HTMLIFrameElement>(null);
	const [loading, setLoading] = useState(true);
	const [broken, setBroken] = useState(false);

	useEffect(() => {
		const expected = new URL(src, window.location.origin).origin;

		const sendTheme = (win: Window) => {
			const dark = document.documentElement.classList.contains("dark");
			try {
				win.postMessage({ type: "theme", dark }, expected);
			} catch {
				/* ignore */
			}
		};

		const onMessage = (e: MessageEvent<IframeMsg>) => {
			const win = frameRef.current?.contentWindow;
			if (!win || e.source !== win) return;

			if (e.origin !== expected) return;

			if (isResizeMsg(e.data)) {
				const el = frameRef.current;
				if (el?.style) el.style.height = `${Math.max(900, e.data.height)}px`;
			} else if (e.data?.type === "ready" || e.data?.type === "ack") {
				sendTheme(win);
			}
		};

		const mo = new MutationObserver(() => {
			const win = frameRef.current?.contentWindow;
			if (win) sendTheme(win);
		});
		mo.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["class"],
		});

		window.addEventListener("message", onMessage);
		return () => {
			window.removeEventListener("message", onMessage);
			mo.disconnect();
		};
	}, []);

	return (
		<div className="max-w-6xl mx-auto p-6 space-y-6">
			<header className="text-center py-6">
				<div className="inline-flex items-center gap-4">
					<div className="w-12 h-12 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow">
						<span className="text-white text-xl">✨</span>
					</div>
					<div className="text-left">
						<h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 dark:from-gray-100 dark:via-blue-100 dark:to-purple-100 bg-clip-text text-transparent">
							Create Advertisement
						</h1>
						<p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
							Design and configure your campaigns
						</p>
					</div>
				</div>
			</header>

			<div className="relative rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden shadow">
				{loading && !broken && (
					<div className="absolute inset-0 grid place-items-center">
						<div className="animate-pulse text-sm text-gray-500 dark:text-gray-400">
							Loading form…
						</div>
					</div>
				)}
				{broken && (
					<div className="p-6 text-sm text-red-600 dark:text-red-400">
						Не вдалося завантажити форму. Відкрий у новій вкладці:{" "}
						<a
							className="underline"
							href={src}
							target="_blank"
							rel="noreferrer"
						>
							{src}
						</a>
					</div>
				)}
				<iframe
					ref={frameRef}
					src={src}
					title="Create Line Item"
					className="block w-full"
					style={{ height: "1200px", border: 0 }}
					sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
					referrerPolicy="strict-origin-when-cross-origin"
					allow="clipboard-read; clipboard-write"
					loading="lazy"
					onLoad={() => {
						setLoading(false);
					}}
					onError={() => {
						setLoading(false);
						setBroken(true);
					}}
				/>
			</div>

			<p className="text-center text-xs text-slate-500">
				Якщо форма не відобразилась, відкрий її{" "}
				<a href={src} target="_blank" rel="noreferrer" className="underline">
					у новій вкладці
				</a>
				.
			</p>
		</div>
	);
}
