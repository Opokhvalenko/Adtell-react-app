import { useEffect } from "react";
import AppRoutes from "./routes/AppRoutes";
import { useAuth } from "./stores/auth";

export default function App() {
  const { hydrate, isLoading } = useAuth();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // глобальний ранній повернення, щоб не мигав UI
  if (isLoading) return null;

  return <AppRoutes />;
}