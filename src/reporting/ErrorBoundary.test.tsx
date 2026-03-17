import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ErrorBoundary } from "./ErrorBoundary";

vi.mock("@/reporting/errors-lazy", () => ({
	reportError: vi.fn(),
}));

let shouldThrow = false;

function ThrowingChild() {
	if (shouldThrow) throw new Error("test error");
	return <div>Child content</div>;
}

afterEach(() => {
	shouldThrow = false;
	cleanup();
});

describe("ErrorBoundary", () => {
	it("renders children when no error", () => {
		render(
			<ErrorBoundary>
				<div>Hello</div>
			</ErrorBoundary>,
		);
		expect(screen.getByText("Hello")).toBeInTheDocument();
	});

	it("shows fallback UI when child throws", () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		shouldThrow = true;

		render(
			<ErrorBoundary>
				<ThrowingChild />
			</ErrorBoundary>,
		);

		expect(screen.getByText("Something went wrong")).toBeInTheDocument();
		expect(
			screen.getByText("An unexpected error occurred. Please try again."),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Try again" }),
		).toBeInTheDocument();

		vi.restoreAllMocks();
	});

	it("recovers when 'Try again' is clicked", () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		shouldThrow = true;

		render(
			<ErrorBoundary>
				<ThrowingChild />
			</ErrorBoundary>,
		);

		expect(screen.getByText("Something went wrong")).toBeInTheDocument();

		shouldThrow = false;
		fireEvent.click(screen.getByRole("button", { name: "Try again" }));

		expect(screen.getByText("Child content")).toBeInTheDocument();

		vi.restoreAllMocks();
	});

	it("has accessible button with type='button'", () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		shouldThrow = true;

		render(
			<ErrorBoundary>
				<ThrowingChild />
			</ErrorBoundary>,
		);

		const btn = screen.getByRole("button", { name: "Try again" });
		expect(btn).toHaveAttribute("type", "button");

		vi.restoreAllMocks();
	});
});
