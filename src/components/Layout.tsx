import { useEffect } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useThemeStore } from "../lib/store";
import { useAuth } from "../stores/auth";
import ThemeToggle from "./ThemeToggle";

export default function Layout() {
  const { theme } = useThemeStore();
  const { isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen">
      <header className="border-b dark:border-gray-700">
        <div className="max-w-6xl mx-auto p-4 flex items-center justify-between gap-4">
          <Link to="/" className="text-xl font-bold">News App</Link>

          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <button type="button" onClick={handleLogout} className="btn-nav">
                Logout
              </button>
            ) : (
              <>
                <Link to="/login" className="btn-nav">Login</Link>
                <Link to="/register" className="btn-nav">Sign up</Link>
              </>
            )}
            <ThemeToggle className="btn-nav" />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4">
        <Outlet />
      </main>
    </div>
  );
}