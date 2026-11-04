import { TabBar } from "~/components/TabBar";
import { Tab } from "~/components/Tab";

export function meta() {
  return [
    { title: "Nexus Tracker" },
    { name: "description", content: "Nexus Tracker" },
  ];
}

export default function Profile() { 

  return (
    <>
      <main className="flex flex-col">
        <TabBar>
          <Tab route="/home" label="Home" icons={{ dark: "house-dark.png", light: "house.png", selected: "house-selected.png" }} selected={false} />
          <Tab route="/profile" label="Settings" icons={{ dark: "house-dark.png", light: "house.png", selected: "house-selected.png" }} selected={true} />
        </TabBar>
        <section className="p-6">
          <h1 className="text-2xl font-bold">Profile</h1>
          {status === "loading" && <p>Loading profile...</p>}
          {status === "missing" && <p>No profile found.</p>}
          {status === "error" && (
            <div role="alert">
              <p>{error}</p>
              <button type="button" onClick={() => void refreshProfile().catch(() => {})}>Try again</button>
            </div>
          )}
          {profile && (
            <dl className="mt-4">
              <dt>Name</dt>
              <dd>{profile.display_name || "Not provided"}</dd>
              <dt>Birthday</dt>
              <dd>{profile.birthday || "Not provided"}</dd>
            </dl>
          )}
        </section>
      </main>
    </>
  );
}
