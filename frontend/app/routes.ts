import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
    index("routes/setup.tsx"),
    layout("layouts/dashboard-layout.tsx", [
        route("/profile", "routes/profile.tsx"),
        route("/home", "routes/home.tsx")
    ])
] satisfies RouteConfig;
