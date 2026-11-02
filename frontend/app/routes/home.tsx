import { TabBar } from "~/components/TabBar";
import { Tab } from "~/components/Tab";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { api_url } from "~/module/api";
import { useAuth0 } from '@auth0/auth0-react';

export function meta() {
  return [
    { title: "Nexus Tracker" },
    { name: "description", content: "Nexus Tracker" },
  ];
}

export default function Home() {

  useEffect(() => {
    fetch(`${api_url}`)
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.error(error));
  });

  return (
    <>
      <main className="flex flex-col">
        <TabBar>
          <Tab route="/home" label="Home" icons={{ dark: "house-dark.png", light: "house.png", selected: "house-selected.png" }} selected={true} />
          <Tab route="/profile" label="Settings" icons={{ dark: "house-dark.png", light: "house.png", selected: "house-selected.png" }} selected={false} />
        </TabBar>
      </main>
    </>
  );
}
