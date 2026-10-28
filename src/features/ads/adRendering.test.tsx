import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchDirectSold } from "../../../modules/ownAdServer.js";
import {
	createAdFrame,
	OWN_AD_SERVER,
	pickWinner,
	slotsWithoutWinner,
} from "../../../modules/prebid.auction.js";
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

describe("own ad server (direct-sold line items)", () => {
	const mockFetch = vi.fn();
	beforeEach(() => {
		mockFetch.mockReset();
		vi.stubGlobal("fetch", mockFetch);
	});
	afterEach(() => vi.unstubAllGlobals());

	const response = (status: number, body?: unknown) =>
		Promise.resolve({
			ok: status < 400,
			status,
			json: () => Promise.resolve(body),
		});

	it("asks the existing /api/bid on the site's own origin with only the accepted parameters", async () => {
		mockFetch.mockReturnValueOnce(response(204));
		await fetchDirectSold("slot-1", [300, 250]);
		const [url, init] = mockFetch.mock.calls[0];
		expect(url).toBe("/api/bid?size=300x250&type=banner");
		expect(init.credentials).toBe("same-origin");
	});

	it("no line item for the size (204) → no direct-sold ad", async () => {
		mockFetch.mockReturnValueOnce(response(204));
		expect(await fetchDirectSold("slot-1", [300, 250])).toBeNull();
	});

	it("a line item becomes a renderable winner for the slot", async () => {
		mockFetch.mockReturnValueOnce(
			response(200, {
				lineItemId: "li-1",
				cpm: 9,
				w: 300,
				h: 250,
				adm: "<b>own</b>",
			}),
		);
		expect(await fetchDirectSold("slot-1", [300, 250])).toMatchObject({
			adUnitCode: "slot-1",
			bidderCode: OWN_AD_SERVER,
			ad: "<b>own</b>",
			creativeId: "li-1",
		});
	});

	it("an ad server failure never breaks the auction", async () => {
		mockFetch.mockRejectedValueOnce(new Error("offline"));
		expect(await fetchDirectSold("slot-1", [300, 250])).toBeNull();
	});
});

describe("winner selection", () => {
	it("a direct-sold line item wins over programmatic bids, even with a lower CPM", () => {
		const bids = [
			{ bidderCode: "adtelligent", cpm: 2.7 },
			{ bidderCode: "bidmatic_local", cpm: 3.1 },
			{ bidderCode: OWN_AD_SERVER, cpm: 1.2 },
		];
		expect(pickWinner(bids, "bidmatic_local")?.bidderCode).toBe(OWN_AD_SERVER);
	});

	it("without it: the slot's preferred bidder, then Adtelligent, then the best CPM", () => {
		const bids = [
			{ bidderCode: "adtelligent", cpm: 2.7 },
			{ bidderCode: "bidmatic_local", cpm: 3.1 },
		];
		expect(pickWinner(bids, "bidmatic_local")?.bidderCode).toBe(
			"bidmatic_local",
		);
		expect(pickWinner(bids, null)?.bidderCode).toBe("adtelligent");
		expect(
			pickWinner(
				[
					{ bidderCode: "x", cpm: 1 },
					{ bidderCode: "y", cpm: 2 },
				],
				null,
			)?.bidderCode,
		).toBe("y");
	});
});

describe("slotsWithoutWinner", () => {
	it("a direct-sold ad in one slot leaves the other slots waiting for late bids", () => {
		const winners = [{ adUnitCode: "ad-mobile", bidderCode: OWN_AD_SERVER }];
		expect(slotsWithoutWinner(["ad-top", "ad-mobile"], winners)).toEqual([
			"ad-top",
		]);
	});
	it("nothing is pending once every slot has a winner", () => {
		const winners = [{ adUnitCode: "a" }, { adUnitCode: "b" }];
		expect(slotsWithoutWinner(["a", "b"], winners)).toEqual([]);
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
