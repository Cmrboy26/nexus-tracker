import { useState } from "react";

export function Sections({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex flex-col p-4">
      {children}
    </section>
  );
}

export function Section({ children, flex, notSectioned, ...options }: { children: React.ReactNode; flex?: boolean; notSectioned?: boolean; [key: string]: any }) {
  return (
    <section className={`mt-4 p-2 ${notSectioned ? "" : "bg-gray-200 dark:bg-gray-800  border-3 rounded-lg border-gray-800 dark:border-gray-200"} ${flex ? "flex-1" : ""}`} {...options}>
      {children}
    </section>
  );
}

export function SectionDropdown({ children, summary }: { children: React.ReactNode; summary?: React.ReactNode }) {

  return (
    <details className="group relative pr-8">
      <summary className="flex group-not-open:h-full items-center justify-between [&_h2]:inline fill-current list-none cursor-pointer [&::-webkit-details-marker]:hidden">
        <div>
          {summary}
        </div>
        <span aria-hidden="true" className="absolute right-0 top-1/2 -translate-y-1/2 group-open:hidden">
          <img
            src="/icons/outline.svg"
            alt="Expand"
            className="w-6 h-6 dark:invert"
          />
        </span>
        <span aria-hidden="true" className="absolute right-0 top-1/2 hidden -translate-y-1/2 group-open:inline">
          <img
            src="/icons/outline.svg"
            alt="Collapse"
            className="w-6 h-6 dark:invert"
          />
        </span>
      </summary>
      <div>
        {children}
      </div>
    </details>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-2xl font-bold">
      {children}
    </h2>
  );
}

export default { Sections, Section, SectionTitle, SectionDropdown };