import { type ComponentPropsWithoutRef } from "react";

export function Button({ type = "button", className = "", compact = false, ...options }: ComponentPropsWithoutRef<"button"> & { compact?: boolean }) {
	return (
		<button
			type={type}
			className={`border rounded-lg ${compact ? "px-2 py-1 m-1 text-sm" : "p-2 m-2"} bg-white dark:bg-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
			{...options}
		/>
	);
}
