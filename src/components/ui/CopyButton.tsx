import { useState } from "react";
import { Button } from "./Button";

export default function CopyButton({
	text,
	className,
	onCopied,
}: {
	text: string;
	className?: string;
	onCopied?: () => void;
}) {
	const [copied, setCopied] = useState(false);
	return (
		<Button
			className={className}
			onClick={async () => {
				try {
					await navigator.clipboard.writeText(text);
					setCopied(true);
					onCopied?.();
					setTimeout(() => setCopied(false), 1500);
				} catch {}
			}}
			aria-live="polite"
		>
			{copied ? "Copied!" : "Copy"}
		</Button>
	);
}
