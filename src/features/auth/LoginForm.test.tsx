import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AUTH_ERROR_TEXT } from "@/lib/auth";
import LoginForm from "./LoginForm";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => ({
	...(await vi.importActual<typeof import("react-router-dom")>(
		"react-router-dom",
	)),
	useNavigate: () => mockNavigate,
}));

const mockHydrate = vi.fn();
vi.mock("@/store/auth", () => ({
	useAuth: () => ({ hydrate: mockHydrate, isLoading: false }),
}));

const mockFetch = vi.fn();
const reply = (status: number, body: unknown) =>
	Promise.resolve(
		new Response(JSON.stringify(body), {
			status,
			headers: { "content-type": "application/json" },
		}),
	);

beforeEach(() => {
	mockFetch.mockReset();
	mockNavigate.mockReset();
	mockHydrate.mockReset();
	vi.stubGlobal("fetch", mockFetch);
});
afterEach(() => vi.unstubAllGlobals());

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
				screen.getByText(/password must be at least 8 characters/i),
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

	it("the demo button signs in without a password and opens the app", async () => {
		mockFetch.mockReturnValueOnce(
			reply(200, { id: "1", email: "demo@example.com" }),
		);
		renderLogin();
		fireEvent.click(screen.getByRole("button", { name: /try the demo/i }));

		await waitFor(() =>
			expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true }),
		);
		const [url, init] = mockFetch.mock.calls[0];
		expect(url).toBe("/api/auth/demo");
		expect(init.method).toBe("POST");
		// JSON, never a body a cross-site form could send: the server requires it
		expect(init.headers).toEqual({ "Content-Type": "application/json" });
		expect(init.body).toBe("{}");
		expect(mockHydrate).toHaveBeenCalled();
	});

	it("a demo that is not configured says so", async () => {
		mockFetch.mockReturnValueOnce(reply(404, { error: "Not Found" }));
		renderLogin();
		fireEvent.click(screen.getByRole("button", { name: /try the demo/i }));

		expect(
			await screen.findByText(AUTH_ERROR_TEXT.demoUnavailable),
		).toBeInTheDocument();
		expect(mockNavigate).not.toHaveBeenCalled();
	});

	it.each([
		[401, AUTH_ERROR_TEXT.credentials],
		[429, AUTH_ERROR_TEXT.busy],
	])("a login answered %i shows its own message", async (status, text) => {
		mockFetch.mockReturnValueOnce(
			reply(status, { error: "server text", statusCode: status }),
		);
		renderLogin();
		fireEvent.change(screen.getByRole("textbox", { name: /email/i }), {
			target: { value: "user@example.com" },
		});
		fireEvent.change(screen.getByLabelText(/password/i), {
			target: { value: "password-123" },
		});
		fireEvent.click(screen.getByRole("button", { name: /\blogin$/i }));

		expect(await screen.findByText(text)).toBeInTheDocument();
		expect(screen.queryByText("server text")).toBeNull();
	});
});
