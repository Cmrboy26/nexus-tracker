import { type ComponentPropsWithoutRef } from "react";

export function Button({ type = "button", className = "", ...options }: ComponentPropsWithoutRef<"button">) {
	return (
		<button
			type={type}
			className={`border rounded-lg p-2 m-2 bg-white dark:bg-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
			{...options}
		/>
	);
}
