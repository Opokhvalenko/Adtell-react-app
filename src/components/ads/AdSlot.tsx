import { useEffect, useRef } from "react";
import { resolveAdserverEndpoint } from "@/lib/adserver";
import type { AdClient } from "@/types/adserver-client";

type Props = {
	id?: string;
	className?: string;
	style?: React.CSSProperties;
	sizes: string[];
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
						const el = ref.current;
						if (!el) return;

						const hasIframe = !!el.querySelector("iframe");
						const hasHtml = !!el.innerHTML && el.innerHTML.trim().length > 0;
						if (hasIframe || hasHtml) return;

						try {
							const runtimePath = new URL(
								"/modules/adserver.client.js",
								window.location.origin,
							).href;

							const mod = (await import(
								/* @vite-ignore */ runtimePath
							)) as unknown as AdClient;

							const best = sizes[0];
							if (!/^\d+x\d+$/.test(best)) return;
							const sizeKey = best as `${number}x${number}`;

							const ep = resolveAdserverEndpoint(endpoint);

							const bid = await mod.requestBid({
								size: sizeKey,
								type,
								geo,
								uid: window.__ads?.uid || "",
								floor: floorCpm,
								endpoint: ep,
							});

							if (bid && el) {
								mod.renderBidInto(el, bid, { endpoint: ep });
							}
						} catch {}
					}, graceMs);

					return () => clearTimeout(t);
				})();
			}
		});

		io.observe(ref.current);
		return () => io.disconnect();
	}, [sizes, type, geo, floorCpm, endpoint]);

	return <div id={id} ref={ref} className={className} style={style} />;
}
