export default function Footer() {
	return (
		<footer className="mt-10 border-t dark:border-gray-700">
			<div className="max-w-6xl mx-auto p-4 text-sm opacity-80 flex items-center justify-between">
				<span>© {new Date().getFullYear()} News App</span>
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
