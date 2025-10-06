import { expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Header from "./components/Header";
import { useAuth } from "./store/auth";

it("renders header brand link", async () => {
	useAuth.setState({ isLoading: false, isLoggedIn: false });

	render(
		<MemoryRouter initialEntries={["/"]}>
			<Header />
		</MemoryRouter>,
	);

	const brand = screen.getByRole("link", { name: /news app/i });
	expect(brand).toBeInTheDocument();
});
