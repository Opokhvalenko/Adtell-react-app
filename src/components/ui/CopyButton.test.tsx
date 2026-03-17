import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import CopyButton from "./CopyButton";

afterEach(cleanup);

describe("CopyButton", () => {
	it("renders with default label", () => {
		render(<CopyButton text="hello" />);
		expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
	});

	it("shows 'Copied!' after successful copy", async () => {
		Object.assign(navigator, {
			clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
		});

		render(<CopyButton text="hello" />);
		fireEvent.click(screen.getByRole("button"));

		await waitFor(() => {
			expect(screen.getByText("Copied!")).toBeInTheDocument();
		});
		expect(navigator.clipboard.writeText).toHaveBeenCalledWith("hello");
	});

	it("shows 'Failed to copy' when clipboard API rejects", async () => {
		Object.assign(navigator, {
			clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
		});

		render(<CopyButton text="hello" />);
		fireEvent.click(screen.getByRole("button"));

		await waitFor(() => {
			expect(screen.getByText("Failed to copy")).toBeInTheDocument();
		});
	});

	it("calls onCopied callback on success", async () => {
		Object.assign(navigator, {
			clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
		});
		const onCopied = vi.fn();

		render(<CopyButton text="hello" onCopied={onCopied} />);
		fireEvent.click(screen.getByRole("button"));

		await waitFor(() => {
			expect(onCopied).toHaveBeenCalledOnce();
		});
	});

	it("has aria-live for accessibility", () => {
		render(<CopyButton text="hello" />);
		expect(screen.getByRole("button")).toHaveAttribute("aria-live", "polite");
	});
});
