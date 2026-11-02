import { Link } from "react-router";
import { useEffect } from "react";

export function Tab({ route, label, icons, selected }: { route: string; label?: string; selected?: boolean; icons: { dark: string; light: string; selected: string } }) {
    let dark = false;
    useEffect(() => {
        dark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    }, []);
    
    return (
        <Link to={route} className="text-xl flex flex-col justify-center items-center" >
            {icons && <img src={selected ? icons.selected : (dark ? icons.dark : icons.light)} alt={label ?? route} className="w-10 h-10" />}
            {label ?? route}
        </Link>
    );
}