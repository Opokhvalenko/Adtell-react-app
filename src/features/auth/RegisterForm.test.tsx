import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import RegisterForm from "./RegisterForm";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
	const actual = await vi.importActual("react-router-dom");
	return { ...actual, useNavigate: () => mockNavigate };
});

const mockRegister = vi.fn();
const mockLogin = vi.fn();
const mockHydrate = vi.fn();
vi.mock("@/lib/auth", () => ({
	apiRegister: (...args: unknown[]) => mockRegister(...args),
	apiLogin: (...args: unknown[]) => mockLogin(...args),
}));

vi.mock("@/store/auth", () => ({
	useAuth: () => ({ hydrate: mockHydrate }),
}));

function renderRegister() {
	return render(
		<MemoryRouter>
			<RegisterForm />
		</MemoryRouter>,
	);
}

function fillForm(
	name = "John Doe",
	email = "john@example.com",
	password = "secret123",
) {
	fireEvent.change(screen.getByLabelText(/^name$/i), {
		target: { value: name },
	});
	fireEvent.change(screen.getByLabelText(/email/i), {
		target: { value: email },
	});

	const passwordFields = screen.getAllByLabelText(/password/i);
	fireEvent.change(passwordFields[0], { target: { value: password } });
	fireEvent.change(passwordFields[1], { target: { value: password } });
}

beforeEach(() => {
	mockNavigate.mockReset();
	mockRegister.mockReset();
	mockLogin.mockReset();
	mockHydrate.mockReset();
});

afterEach(cleanup);

describe("RegisterForm integration", () => {
	it("renders all form fields", () => {
		renderRegister();

		expect(
			screen.getByRole("heading", { name: /sign up/i }),
		).toBeInTheDocument();
		expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
		expect(screen.getAllByLabelText(/password/i)).toHaveLength(2);
		expect(
			screen.getByRole("button", { name: /create account/i }),
		).toBeInTheDocument();
	});

	it("shows validation errors for empty submit", async () => {
		renderRegister();

		fireEvent.click(screen.getByRole("button", { name: /create account/i }));

		await waitFor(() => {
			expect(screen.getByText(/name must be at least/i)).toBeInTheDocument();
		});
	});

	it("calls register → login → hydrate → navigate on success", async () => {
		mockRegister.mockResolvedValue({});
		mockLogin.mockResolvedValue({});
		mockHydrate.mockResolvedValue(undefined);

		renderRegister();
		fillForm();
		fireEvent.click(screen.getByRole("button", { name: /create account/i }));

		await waitFor(() => {
			expect(mockRegister).toHaveBeenCalledWith(
				"john@example.com",
				"secret123",
			);
		});

		await waitFor(() => {
			expect(mockLogin).toHaveBeenCalledWith("john@example.com", "secret123");
			expect(mockHydrate).toHaveBeenCalled();
			expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
		});
	});

	it("shows error when registration fails", async () => {
		mockRegister.mockRejectedValue(new Error("Email already exists"));

		renderRegister();
		fillForm();
		fireEvent.click(screen.getByRole("button", { name: /create account/i }));

		await waitFor(() => {
			expect(screen.getByText("Email already exists")).toBeInTheDocument();
		});

		expect(mockLogin).not.toHaveBeenCalled();
	});

	it("redirects to login when auto-login fails after successful register", async () => {
		mockRegister.mockResolvedValue({});
		mockLogin.mockRejectedValue(new Error("Login failed"));

		renderRegister();
		fillForm();
		fireEvent.click(screen.getByRole("button", { name: /create account/i }));

		await waitFor(() => {
			expect(mockNavigate).toHaveBeenCalledWith("/login", { replace: true });
		});
	});

	it("trims email before sending", async () => {
		mockRegister.mockResolvedValue({});
		mockLogin.mockResolvedValue({});
		mockHydrate.mockResolvedValue(undefined);

		renderRegister();
		fillForm("John", "  john@example.com  ", "secret123");
		fireEvent.click(screen.getByRole("button", { name: /create account/i }));

		await waitFor(() => {
			expect(mockRegister).toHaveBeenCalledWith(
				"john@example.com",
				"secret123",
			);
		});
	});
});
