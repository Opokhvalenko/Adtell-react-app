import { render, screen } from "@testing-library/react";
import App from "./App";

it("renders header", () => {
	render(<App />);
	expect(screen.getByText(/News App/i)).toBeInTheDocument();
});
