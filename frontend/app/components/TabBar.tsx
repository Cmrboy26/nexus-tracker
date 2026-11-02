import { Link } from "react-router";

export function TabBar({ children }: { children: React.ReactNode }) {
    return (
        <nav className="fixed bottom-0 w-full flex justify-around items-end border-t-2 pt-2 pb-2 border-gray-600">
            {children}
        </nav>
    )
}