import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AUTH_ERROR_TEXT, AuthRequestError } from "@/lib/auth";
import RegisterForm from "./RegisterForm";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
	const actual = await vi.importActual("react-router-dom");
	return { ...actual, useNavigate: () => mockNavigate };
});

const mockRegister = vi.fn();
const mockHydrate = vi.fn();
vi.mock("@/lib/auth", async () => ({
	...(await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth")),
	apiRegister: (...args: unknown[]) => mockRegister(...args),
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

function fillForm(email = "john@example.com", password = "secret123") {
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
	mockHydrate.mockReset();
});

afterEach(cleanup);

describe("RegisterForm integration", () => {
	it("renders all form fields", () => {
		renderRegister();

		expect(
			screen.getByRole("heading", { name: /sign up/i }),
		).toBeInTheDocument();
		expect(screen.queryByLabelText(/^name$/i)).not.toBeInTheDocument();
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
			expect(screen.getByText(/enter a valid email/i)).toBeInTheDocument();
		});
	});

	it("calls register → hydrate → navigate on success (no second login)", async () => {
		mockRegister.mockResolvedValue({});
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
			expect(mockHydrate).toHaveBeenCalled();
			expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
		});
	});

	it("an email that is already registered gets its own message", async () => {
		mockRegister.mockRejectedValue(new AuthRequestError(409));

		renderRegister();
		fillForm();
		fireEvent.click(screen.getByRole("button", { name: /create account/i }));

		await waitFor(() => {
			expect(screen.getByText(AUTH_ERROR_TEXT.taken)).toBeInTheDocument();
		});

		expect(mockHydrate).not.toHaveBeenCalled();
		expect(mockNavigate).not.toHaveBeenCalled();
	});

	it("trims email before sending", async () => {
		mockRegister.mockResolvedValue({});
		mockHydrate.mockResolvedValue(undefined);

		renderRegister();
		fillForm("  john@example.com  ", "secret123");
		fireEvent.click(screen.getByRole("button", { name: /create account/i }));

		await waitFor(() => {
			expect(mockRegister).toHaveBeenCalledWith(
				"john@example.com",
				"secret123",
			);
		});
	});
});
