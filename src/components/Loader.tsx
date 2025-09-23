export default function Loader({
	label = "Loading…",
	className = "p-4",
}: {
	label?: string;
	className?: string;
}) {
	return (
		<output aria-live="polite" aria-busy="true" className={className}>
			{label}
		</output>
	);
}
