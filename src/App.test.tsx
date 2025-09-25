import "@testing-library/jest-dom/vitest";
import { render, screen, within } from "@testing-library/react";
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

	const header = await screen.findByRole("banner");
	const brand = within(header).getByRole("link", { name: /^News App$/i });
	expect(brand).toBeInTheDocument();
});
