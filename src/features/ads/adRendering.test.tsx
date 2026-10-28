import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { spec } from "../../../modules/customBidAdapter.js";
import { createAdFrame } from "../../../modules/prebid.auction.js";
import { renderSafeHtml } from "../news/renderSafeHtml";

const MARKUP = "<script>parent.document.title='pwned'</script><b>ad</b>";

describe("createAdFrame (third-party bid markup)", () => {
	it("isolates the markup in a sandbox without same-origin access", () => {
		const frame = createAdFrame({ ad: MARKUP }, 300, 250);
		const sandbox = frame.getAttribute("sandbox") ?? "";
		expect(sandbox).toContain("allow-scripts");
		expect(sandbox).not.toContain("allow-same-origin");
	});

	it("puts the markup into srcdoc instead of writing into the page's origin", () => {
		const frame = createAdFrame({ ad: MARKUP }, 300, 250);
		expect(frame.srcdoc).toContain(MARKUP);
	});

	it("loads an ad URL in the same sandbox", () => {
		const frame = createAdFrame(
			{ adUrl: "https://ads.example.test/creative" },
			728,
			90,
		);
		expect(frame.src).toBe("https://ads.example.test/creative");
		expect(frame.getAttribute("sandbox")).not.toContain("allow-same-origin");
	});
});

describe("customAdServer bid adapter contract", () => {
	const bid = {
		bidId: "b1",
		adUnitCode: "slot-1",
		mediaTypes: { banner: { sizes: [[300, 250]] } },
	};

	it("calls the existing /api/bid route with only the parameters it accepts", () => {
		const [request] = spec.buildRequests([bid], { auctionId: "a1" });
		const url = new URL(request.url);
		expect(url.pathname).toBe("/api/bid");
		expect(Object.fromEntries(url.searchParams)).toEqual({
			size: "300x250",
			type: "banner",
		});
	});

	it("maps the server response (lineItemId, adm) into a Prebid bid", () => {
		const [request] = spec.buildRequests([bid], { auctionId: "a1" });
		const [result] = spec.interpretResponse(
			{
				body: { lineItemId: "li-1", cpm: 1.5, w: 300, h: 250, adm: "<b>x</b>" },
			},
			request,
		);
		expect(result).toMatchObject({
			creativeId: "li-1",
			cpm: 1.5,
			ad: "<b>x</b>",
		});
	});
});

describe("renderSafeHtml (article body)", () => {
	const html = (markup: string) =>
		render(<div>{renderSafeHtml(markup)}</div>).container.innerHTML;

	it("drops scripts and event handlers", () => {
		const out = html('<p onclick="alert(1)">text</p><script>alert(1)</script>');
		expect(out).toContain("text");
		expect(out).not.toMatch(/script|onclick/);
	});

	it("drops javascript: links but keeps http(s) links", () => {
		expect(html('<a href="javascript:alert(1)">x</a>')).not.toContain(
			"javascript",
		);
		expect(html('<a href="https://news.test/">x</a>')).toContain(
			'href="https://news.test/"',
		);
	});

	it("keeps only https images", () => {
		expect(html('<img src="http://tracker.test/p.gif">')).not.toContain("<img");
		expect(html('<img src="https://cdn.test/p.png">')).toContain(
			'src="https://cdn.test/p.png"',
		);
	});
});
