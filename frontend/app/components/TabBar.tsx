import { Link } from "react-router";

export function TabBar({ children, mainNav }: { children: React.ReactNode, mainNav?: boolean }) {
    return (
        <nav className={`shrink-0 w-full flex justify-around items-end  pt-2 pb-2 border-gray-600 ${mainNav ? "border-t-2" : ""}`}>
            {children}
        </nav>
    )
}