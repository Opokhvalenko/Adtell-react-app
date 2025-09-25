import { buildTime } from "virtual:build-info";

export default function Footer() {
	const iso =
		buildTime ??
		(typeof __BUILD_TIME__ !== "undefined"
			? __BUILD_TIME__
			: new Date().toISOString());

	const builtAt = new Date(iso).toLocaleString();

	return (
		<footer className="mt-10 border-t dark:border-gray-700">
			<div className="max-w-6xl mx-auto p-4 text-sm opacity-80 flex items-center justify-between gap-3 flex-wrap">
				<span>© {new Date().getFullYear()} News App</span>
				<span className="opacity-70">build: {builtAt}</span>
				<a
					href="https://github.com/Opokhvalenko"
					target="_blank"
					rel="noreferrer"
					className="hover:underline"
				>
					GitHub
				</a>
			</div>
		</footer>
	);
}
