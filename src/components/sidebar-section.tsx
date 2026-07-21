"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";

import type { TItem } from "@/types/sidebar.types";
import { SidebarNavItem } from "./sidebar-nav-item";

export default function SidebarSection({
    title,
    items,
    defaultOpen = false,
}: {
    title: string;
    items: TItem[];
    defaultOpen?: boolean;
}) {
    const pathname = usePathname();
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className="border-t border-gray-100">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-3 py-3.5 text-[10px] font-bold tracking-[0.14em] uppercase text-gray-400 hover:text-gray-600 transition-colors"
            >
                <span>{title}</span>

                <ChevronDown
                    size={14}
                    className={`transition-transform duration-300 ${
                        open ? "rotate-180" : ""
                    }`}
                />
            </button>

            <div
                className={`overflow-hidden transition-all duration-300 ${
                    open
                        ? "max-h-96 opacity-100 pb-2"
                        : "max-h-0 opacity-0"
                }`}
            >
                <div className="px-2 space-y-0.5">
                    {items.map((item) => (
                        <SidebarNavItem
                            key={item.id}
                            item={item}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}