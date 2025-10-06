import { useEffect, useRef } from "react";
import { useAuth } from "@/store/auth";

export default function CreateAdShadow() {
	const frameRef = useRef<HTMLIFrameElement>(null);
	const { token } = useAuth();

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

	const src = token
		? `/create-lineitem?token=${encodeURIComponent(token)}`
		: "/create-lineitem"; // ← той самий origin (:5173), Vite проксить на бек

	return (
		<div className="max-w-6xl mx-auto p-6 space-y-8">
			{/* Header section */}
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

			{/* Form container */}
			<div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden shadow-xl">
				<iframe
					ref={frameRef}
					src={src}
					title="Create Line Item"
					style={{ width: "100%", height: "1200px", border: 0 }}
					sandbox="allow-forms allow-scripts allow-popups allow-downloads allow-same-origin"
				/>
			</div>

			<p className="mt-3 text-center text-sm text-slate-500">
				Якщо форма не відображається, відкрий її{" "}
				<a
					href={
						token
							? `/create-lineitem?token=${encodeURIComponent(token)}`
							: "/create-lineitem"
					}
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
