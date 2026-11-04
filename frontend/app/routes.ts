import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
    index("routes/setup.tsx"),
    //route("/login", "routes/login.tsx"),
    layout("layouts/dashboard-layout.tsx", [
        route("/profile", "routes/profile.tsx"),
        route("/home", "routes/home.tsx")
    ])
] satisfies RouteConfig;
