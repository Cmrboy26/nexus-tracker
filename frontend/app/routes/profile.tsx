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
      </main>
    </>
  );
}
