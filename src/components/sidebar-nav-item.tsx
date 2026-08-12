"use client";

import { PAGES } from "@/config/pages.config";
import type { TItem } from "@/types/sidebar.types";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Monitor,
    Tag,
    ShoppingCart,
    Receipt,
    Wallet,
    Wrench,
    Undo2,
    RotateCcw,
    Users,
    BadgeDollarSign,
    Landmark,
    Warehouse,
    MapPin,
    Building,
    Calendar,
    Clock,
    ClipboardClock,
    FileMinus,
} from "lucide-react";

const icons = {
    dashboard: LayoutDashboard,
    monitor: Monitor,
    tag: Tag,
    cart: ShoppingCart,
    receipt: Receipt,
    wallet: Wallet,
    wrench: Wrench,
    undo: Undo2,
    "rotate-ccw": RotateCcw,
    users: Users,
    landmark: Landmark,
    "badge-dollar": BadgeDollarSign,
    warehouse: Warehouse,
    "file-minus": FileMinus,
    "map-pin": MapPin,
    "building": Building,
    calendar: Calendar,
    clock: Clock,
    timesheet: ClipboardClock, 
};

export function SidebarNavItem({
    item,
}: {
    item: TItem;
}) {
    const pathname = usePathname();

    const active =
        pathname === item.href ||
        pathname.startsWith(item.href + PAGES.HOME);

    const Icon = icons[item.icon];

    return (
        <Link href={item.href}>
            <button
                className={`
                    group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                    text-sm font-medium transition-all duration-200 text-left cursor-pointer
                    ${
                        active
                            ? "bg-gray-100 text-gray-900"
                            : "text-gray-500 hover:bg-gray-50 hover:text-red-700"
                    }
                `}
            >
                <span
                    className={`
                        absolute left-0 top-1/2 -translate-y-1/2 w-0.75 rounded-r-full
                        transition-all duration-300
                        ${
                            active
                                ? "h-6 bg-red-500"
                                : "h-0 group-hover:h-4 bg-red-400"
                        }
                    `}
                />

                <Icon
                    size={17}
                    className={`shrink-0 transition-colors duration-200 ${
                        active
                            ? "text-red-700"
                            : "text-black group-hover:text-red-500"
                    }`}
                />

                <span
                    className={`flex-1 ${
                        active
                            ? "text-red-600"
                            : "text-black/70 group-hover:text-red-500"
                    }`}
                >
                    {item.label}
                </span>

                {item.badge && (
                    <span className="flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-red-900 text-white rounded-full">
                        {item.badge}
                    </span>
                )}
            </button>
        </Link>
    );
}