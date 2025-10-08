import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LoginForm from "./LoginForm";

// Mock the auth store
vi.mock("../../store/auth", () => ({
	useAuth: () => ({
		login: vi.fn(),
		isLoading: false,
	}),
}));

describe("LoginForm Component", () => {
	let queryClient: QueryClient;

	beforeEach(() => {
		queryClient = new QueryClient({
			defaultOptions: {
				queries: {
					retry: false,
				},
			},
		});
	});

	it("renders login form", () => {
		render(
			<QueryClientProvider client={queryClient}>
				<MemoryRouter>
					<LoginForm />
				</MemoryRouter>
			</QueryClientProvider>,
		);

		expect(screen.getByRole("textbox")).toBeInTheDocument();
		expect(screen.getAllByDisplayValue("")).toHaveLength(2);
		expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
	});

	it("shows validation errors for empty fields", async () => {
		render(
			<QueryClientProvider client={queryClient}>
				<MemoryRouter>
					<LoginForm />
				</MemoryRouter>
			</QueryClientProvider>,
		);

		const submitButton = screen.getByRole("button", { name: /login/i });
		fireEvent.click(submitButton);

		await waitFor(() => {
			expect(screen.getByText(/enter a valid email/i)).toBeInTheDocument();
			expect(
				screen.getByText(/password must be at least 6 characters/i),
			).toBeInTheDocument();
		});
	});

	it("shows validation error for invalid email", async () => {
		render(
			<QueryClientProvider client={queryClient}>
				<MemoryRouter>
					<LoginForm />
				</MemoryRouter>
			</QueryClientProvider>,
		);

		const emailInput = screen.getByRole("textbox", { name: "" });
		const submitButton = screen.getByRole("button", { name: /login/i });

		fireEvent.change(emailInput, { target: { value: "invalid-email" } });
		fireEvent.click(submitButton);

		await waitFor(() => {
			expect(screen.getByText(/enter a valid email/i)).toBeInTheDocument();
		});
	});
});
