export default function Loader({
	label = "Loading…",
	className = "p-4",
}: {
	label?: string;
	className?: string;
}) {
	return (
		<div className={`flex flex-col items-center justify-center ${className}`}>
			<div className="loading-spinner mb-3"></div>
			<output
				aria-live="polite"
				aria-busy="true"
				className="text-sm text-gray-600 dark:text-gray-400 font-medium"
			>
				{label}
			</output>
		</div>
	);
}
