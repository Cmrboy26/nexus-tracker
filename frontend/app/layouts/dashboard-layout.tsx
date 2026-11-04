import { useAuth0 } from "@auth0/auth0-react";
import { Navigate, Outlet } from "react-router";
import { Tab } from "~/components/Tab";
import { TabBar } from "~/components/TabBar";
import { useProfile } from "~/hooks/useProfile";

export default function DashboardLayout() {
  const { isAuthenticated, isLoading, error } = useAuth0();
  const { status, error: profileError, isRefreshing, refreshProfile } = useProfile();

  if (error) return <p>Authentication failed.</p>;
  if (isLoading || (isAuthenticated && status === "loading")) return <p>Loading...</p>;
  if (!isAuthenticated || status === "missing") return <Navigate to="/" replace />;
  if (status === "error") return <div role="alert"><p>{profileError}</p><button type="button" onClick={() => void refreshProfile()}>Try again</button></div>;
  if (status !== "ready") return <p>Loading...</p>;

  return (
    <div className="flex flex-col h-dvh">
      {isRefreshing && <p role="status">Refreshing profile...</p>}
      {profileError && <div role="alert"><p>{profileError}</p><button type="button" onClick={() => void refreshProfile()}>Try again</button></div>}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <Outlet />
      </div>
      <TabBar mainNav={true}>
        {/* <Tab route="/impacts" label="Impacts" icon="/icons/impacts.svg" />
        <Tab route="/trends" label="Trends" icon="/icons/trends.svg" /> */}
        <Tab route="/home" label="Home" icon="/icons/home.svg" />
        {/* <Tab route="/reports" label="Reports" icon="/icons/report.svg" /> */}
        <Tab route="/profile" label="Settings" icon="/icons/settings.svg" />
      </TabBar>
    </div>
  );
}