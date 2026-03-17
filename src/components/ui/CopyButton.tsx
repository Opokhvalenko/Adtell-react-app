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
	const [failed, setFailed] = useState(false);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			setFailed(false);
			onCopied?.();
			setTimeout(() => setCopied(false), 1500);
		} catch {
			setFailed(true);
			setTimeout(() => setFailed(false), 2000);
		}
	};

	return (
		<Button className={className} onClick={handleCopy} aria-live="polite">
			{failed ? "Failed to copy" : copied ? "Copied!" : "Copy"}
		</Button>
	);
}
