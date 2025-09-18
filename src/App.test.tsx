import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";

it("renders header", () => {
	render(
		<MemoryRouter initialEntries={["/"]}>
			<App />
		</MemoryRouter>,
	);
	expect(screen.getByText(/News App/i)).toBeInTheDocument();
});
