import { zodResolver } from "@hookform/resolvers/zod";
import { useId } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "../../stores/auth";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type FormData = z.infer<typeof schema>;

const inputCls =
  "w-full rounded-lg px-3 py-2 shadow-sm " +
  "text-gray-900 dark:text-gray-100 " +
  "bg-white dark:bg-gray-800 " +
  "border border-gray-300 dark:border-gray-600 " +
  "placeholder-gray-500 dark:placeholder-gray-400 " +
  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

export default function LoginForm() {
  const emailId = useId();
  const passwordId = useId();
  const emailErrId = `${emailId}-error`;
  const passwordErrId = `${passwordId}-error`;

  const navigate = useNavigate();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), mode: "onTouched" });

  const onSubmit = async () => {
    // тут просто вмикаємо "демо-вхід"
    login();
    navigate("/", { replace: true });
  };

  return (
    <div className="max-w-md mx-auto p-6 rounded-2xl border bg-white/80 dark:bg-gray-800/80 shadow">
      <h2 className="text-2xl font-bold mb-4">Login</h2>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div>
          <label htmlFor={emailId} className="block text-sm mb-1 text-gray-700 dark:text-gray-200">
            Email
          </label>
          <input
            id={emailId}
            type="email"
            inputMode="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? emailErrId : undefined}
            placeholder="name@example.com"
            className={inputCls}
            {...register("email")}
          />
          {errors.email && (
            <p id={emailErrId} className="text-sm text-red-500 mt-1" aria-live="polite">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor={passwordId} className="block text-sm mb-1 text-gray-700 dark:text-gray-200">
            Password
          </label>
          <input
            id={passwordId}
            type="password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? passwordErrId : undefined}
            placeholder="••••••"
            className={inputCls}
            {...register("password")}
          />
          {errors.password && (
            <p id={passwordErrId} className="text-sm text-red-500 mt-1" aria-live="polite">
              {errors.password.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Signing in…" : "Login"}
        </button>

        <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
          Don’t have an account?{" "}
          <Link to="/register" className="font-medium text-blue-600 hover:underline">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}
