import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";

it("renders header", async () => {
	render(
		<MemoryRouter initialEntries={["/"]}>
			<App />
		</MemoryRouter>,
	);

	// findByText почекає, поки Suspense зникне і Header з'явиться
	expect(await screen.findByText(/News App/i)).toBeInTheDocument();
});
