import { useEffect, useRef } from "react";
import { resolveAdserverEndpoint } from "@/lib/adserver";

type Props = {
	id?: string;
	className?: string;
	style?: React.CSSProperties;
	sizes: `${number}x${number}`[];
	type?: string;
	geo?: string;
	floorCpm?: number;
	endpoint?: string;
};

export default function AdSlot({
	id,
	className,
	style,
	sizes,
	type = "banner",
	geo,
	floorCpm,
	endpoint,
}: Props) {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!ref.current || sizes.length === 0) return;

		const io = new IntersectionObserver((entries) => {
			for (const en of entries) {
				if (!en.isIntersecting) continue;
				io.disconnect();

				(async () => {
					const graceMs = 1200;
					const t = setTimeout(async () => {
						if (!ref.current) return;

						const hasIframe = !!ref.current.querySelector("iframe");
						const hasHtml =
							!!ref.current.innerHTML &&
							ref.current.innerHTML.trim().length > 0;
						if (hasIframe || hasHtml) return;

						try {
							const runtimePath = "/modules/adserver.client.js";
							type AdClient = typeof import("modules/adserver.client.js");
							const mod = (await import(
								/* @vite-ignore */ runtimePath
							)) as AdClient;

							const best = sizes[0];
							const ep = resolveAdserverEndpoint(endpoint);

							const bid = await mod.requestBid({
								size: best,
								type,
								geo,
								uid: window.__ads?.uid || "",
								floor: floorCpm,
								endpoint: ep,
							});

							if (bid && ref.current) {
								mod.renderBidInto(ref.current, bid, { endpoint: ep });
							}
						} catch {}
					}, graceMs);

					return () => clearTimeout(t);
				})();
			}
		});

		io.observe(ref.current);
		return () => io.disconnect();
	}, [endpoint, floorCpm, geo, sizes, type]);

	return <div id={id} ref={ref} className={className} style={style} />;
}
