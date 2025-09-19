import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";

it("renders header", async () => {
	render(
		<MemoryRouter initialEntries={["/"]}>
			<App />
		</MemoryRouter>,
	);

	const header = await screen.findByRole("banner");
	const brandLink = within(header).getByRole("link", { name: /^News App$/i });
	expect(brandLink).toBeInTheDocument();
});
