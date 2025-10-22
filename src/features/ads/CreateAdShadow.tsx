import { useEffect, useRef, useState } from "react";
import { API_ORIGIN } from "@/lib/apiBase";

const src = import.meta.env.DEV
	? "/create-lineitem"
	: `${API_ORIGIN}/create-lineitem`;

type Msg =
	| { type: "resize"; height: number }
	| { type: "ready" }
	| { type: "ack" };

const MIN_HEIGHT = 600;

function isResizeMsg(
	d: Msg | unknown,
): d is { type: "resize"; height: number } {
	return (
		!!d && typeof d === "object" && (d as { type?: unknown }).type === "resize"
	);
}

export default function CreateAdShadow() {
	const frameRef = useRef<HTMLIFrameElement>(null);
	const [loading, setLoading] = useState(true);
	const [broken, setBroken] = useState(false);

	useEffect(() => {
		const expected = new URL(src, window.location.origin).origin;

		let lastDark: boolean | undefined;
		let debounceTimer: number | undefined;

		const postTheme = (win: Window) => {
			const dark = document.documentElement.classList.contains("dark");
			if (dark === lastDark) return;
			lastDark = dark;
			try {
				win.postMessage({ type: "theme", dark }, expected);
			} catch {}
		};

		const scheduleTheme = (win: Window) => {
			if (debounceTimer !== undefined) window.clearTimeout(debounceTimer);
			debounceTimer = window.setTimeout(() => postTheme(win), 50);
		};

		const onMessage = (e: MessageEvent<Msg>) => {
			const win = frameRef.current?.contentWindow;
			if (!win || e.source !== win || e.origin !== expected) return;

			if (isResizeMsg(e.data) && typeof e.data.height === "number") {
				const el = frameRef.current;
				if (el?.style)
					el.style.height = `${Math.max(MIN_HEIGHT, e.data.height)}px`;
				return;
			}
			if (e.data?.type === "ready") {
				lastDark = undefined;
				postTheme(win);
			}
		};

		const mo = new MutationObserver(() => {
			const win = frameRef.current?.contentWindow;
			if (win) scheduleTheme(win);
		});
		mo.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["class"],
		});

		const onStorage = (e: StorageEvent) => {
			if (e.key === "theme") {
				const win = frameRef.current?.contentWindow;
				if (win) scheduleTheme(win);
			}
		};

		const onThemeCustom: EventListener = () => {
			const win = frameRef.current?.contentWindow;
			if (win) scheduleTheme(win);
		};

		window.addEventListener("message", onMessage);
		window.addEventListener("storage", onStorage);
		window.addEventListener("themechange", onThemeCustom);

		return () => {
			window.removeEventListener("message", onMessage);
			window.removeEventListener("storage", onStorage);
			window.removeEventListener("themechange", onThemeCustom);
			mo.disconnect();
			if (debounceTimer !== undefined) window.clearTimeout(debounceTimer);
		};
	}, []);

	return (
		<div className="max-w-6xl mx-auto p-6 space-y-6">
			{/* Header */}
			<header className="text-center py-6">
				<div className="inline-flex items-center gap-4">
					<div className="w-12 h-12 rounded-xl bg-emerald-600 text-white grid place-items-center shadow-sm">
						✨
					</div>
					<div className="text-left">
						<h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
							Create Advertisement
						</h1>
						<p className="text-sm text-zinc-600 dark:text-zinc-400">
							Design and configure your campaigns
						</p>
					</div>
				</div>
			</header>

			{/* Frame card */}
			<div className="relative rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden dark:border-zinc-700 dark:bg-zinc-900">
				{loading && !broken && (
					<div className="absolute inset-0 grid place-items-center">
						<div className="animate-pulse text-sm text-zinc-500 dark:text-zinc-400">
							Loading form…
						</div>
					</div>
				)}
				{broken && (
					<div className="p-6 text-sm text-red-600 dark:text-red-400">
						Couldn’t load the form. Open it in a new tab:{" "}
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
					onLoad={() => setLoading(false)}
					onError={() => {
						setLoading(false);
						setBroken(true);
					}}
				/>
			</div>

			<p className="text-center text-xs text-zinc-500">
				If the form doesn’t appear, open it{" "}
				<a href={src} target="_blank" rel="noreferrer" className="underline">
					in a new tab
				</a>
				.
			</p>
		</div>
	);
}
