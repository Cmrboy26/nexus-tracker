import { useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Outlet, useNavigate } from "react-router";

export default function DashboardLayout() {
  const { isAuthenticated, isLoading, error } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !error && !isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isLoading, error, isAuthenticated, navigate]);

  if (error) return <p>Authentication failed.</p>;
  if (isLoading || !isAuthenticated) return <p>Loading...</p>;

  return <Outlet />;
}