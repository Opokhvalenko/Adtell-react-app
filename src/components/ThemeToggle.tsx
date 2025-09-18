import { useThemeStore } from "../lib/store";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useThemeStore();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={className}
      aria-label="Toggle theme"
      title={theme === "dark" ? "Light Mode" : "Dark Mode"}
    >
      {theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode"}
    </button>
  );
}