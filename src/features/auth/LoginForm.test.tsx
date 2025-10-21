import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import LoginForm from "./LoginForm";

// Mock the auth store
vi.mock("../../store/auth", () => ({
	useAuth: () => ({
		login: vi.fn(),
		isLoading: false,
	}),
}));

function renderLogin() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
		},
	});

	return render(
		<QueryClientProvider client={queryClient}>
			<MemoryRouter>
				<LoginForm />
			</MemoryRouter>
		</QueryClientProvider>,
	);
}

describe("LoginForm Component", () => {
	it("renders login form", () => {
		renderLogin();

		expect(screen.getByRole("heading", { name: /login/i })).toBeInTheDocument();
		expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();

		expect(screen.getAllByDisplayValue("")).toHaveLength(2);
	});

	it("shows validation errors for empty fields", async () => {
		renderLogin();

		fireEvent.click(screen.getByRole("button", { name: /login/i }));

		await waitFor(() => {
			expect(screen.getByText(/enter a valid email/i)).toBeInTheDocument();
			expect(
				screen.getByText(/password must be at least 6 characters/i),
			).toBeInTheDocument();
		});
	});

	it("shows validation error for invalid email", async () => {
		renderLogin();

		const emailInput = screen.getByRole("textbox", { name: /email/i });
		fireEvent.change(emailInput, { target: { value: "invalid-email" } });

		fireEvent.click(screen.getByRole("button", { name: /login/i }));

		await waitFor(() => {
			expect(screen.getByText(/enter a valid email/i)).toBeInTheDocument();
		});
	});
});
