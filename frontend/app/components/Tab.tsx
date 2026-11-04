import { NavLink } from "react-router";
import { type MouseEventHandler } from "react";

type TabPropsBase = {
    icon: string;
    iconColor?: string;
    selectedIconColor?: string;
    isActive?: boolean;
};

type TabProps = TabPropsBase & (
    | { route: string; label?: string; onClick?: never }
    | { route?: never; label: string; onClick: MouseEventHandler<HTMLButtonElement> }
);

export function Tab({ route, label, icon, iconColor = "", selectedIconColor = "text-indigo-400", onClick, isActive }: TabProps) {
    const content = (isActive: boolean) => <>
        <span aria-hidden="true" className={`tab-icon ${isActive ? selectedIconColor : iconColor}`} style={{ maskImage: `url("${icon}")` }} />
        {label ?? route}
    </>;
    const className = "text-xl flex flex-col justify-center items-center";

    if (route !== undefined) {
        return <NavLink to={route} className={className}>{({ isActive }) => content(isActive)}</NavLink>;
    }

    return <button type="button" onClick={onClick} className={className}>{content(isActive ?? false)}</button>;
}