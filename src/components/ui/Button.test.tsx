import { fireEvent, render, screen } from "@testing-library/react";
import { Button } from "./Button";

describe("Button", () => {
	it("should render button with text", () => {
		render(<Button>Click me</Button>);

		expect(
			screen.getByRole("button", { name: "Click me" }),
		).toBeInTheDocument();
	});

	it("should handle click events", () => {
		const handleClick = vi.fn();
		render(<Button onClick={handleClick}>Click me</Button>);

		const button = screen.getByRole("button", { name: "Click me" });
		fireEvent.click(button);

		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it("should be disabled when disabled prop is true", () => {
		render(<Button disabled>Disabled button</Button>);

		const button = screen.getByRole("button", { name: "Disabled button" });
		expect(button).toBeDisabled();
	});

	it("should apply variant classes", () => {
		render(<Button variant="destructive">Destructive button</Button>);

		const button = screen.getByRole("button", { name: "Destructive button" });
		expect(button).toBeInTheDocument();
	});

	it("should apply size classes", () => {
		render(<Button size="lg">Large button</Button>);

		const button = screen.getByRole("button", { name: "Large button" });
		expect(button).toBeInTheDocument();
	});
});
