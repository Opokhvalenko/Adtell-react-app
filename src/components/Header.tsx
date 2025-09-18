import { Link, useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "../stores/auth";

export default function Header() {
  const { isLoggedIn, isLoading, logout } = useAuth();
  const navigate = useNavigate();

  if (isLoading) return null; 

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <header className="border-b dark:border-white/20">
      <div className="max-w-6xl mx-auto p-4 flex items-center justify-between gap-4">
        <Link to="/" className="text-xl font-bold">News App</Link>
        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <button type="button" onClick={handleLogout} className="btn-nav">Logout</button>
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
  );
}