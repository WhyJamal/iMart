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
    Percent,
    ArrowLeftRight,
    FileBarChart,
    TrendingUp,
    PackagePlus,
} from "lucide-react";
import { useTranslations } from "next-intl";

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
    percent: Percent,
    "map-pin": MapPin,
    "building": Building,
    calendar: Calendar,
    clock: Clock,
    timesheet: ClipboardClock, 
    "arrow-left-right": ArrowLeftRight,
    "file-bar-chart": FileBarChart,
    "trending-up": TrendingUp,
    "package-plus": PackagePlus,
};

export function SidebarNavItem({
    item,
}: {
    item: TItem;
}) {
    const t = useTranslations("sidebar");
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
                            ? "bg-primary/10 text-sidebar-foreground"
                            : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-primary"
                    }
                `}
            >
                <span
                    className={`
                        absolute left-0 top-1/2 -translate-y-1/2 w-0.75 rounded-r-full
                        bg-primary transition-all duration-300
                        ${
                            active
                                ? "h-6 opacity-100"
                                : "h-0 opacity-60 group-hover:h-4"
                        }
                    `}
                />

                <Icon
                    size={17}
                    className={`shrink-0 transition-colors duration-200 ${
                        active
                            ? "text-primary"
                            : "text-sidebar-foreground/70 group-hover:text-primary"
                    }`}
                />

                <span
                    className={`flex-1 ${
                        active
                            ? "text-primary"
                            : "text-sidebar-foreground/70 group-hover:text-primary"
                    }`}
                >
                    {t(item.labelKey)}
                </span>

                {item.badge && (
                    <span className="flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-primary text-primary-foreground rounded-full">
                        {item.badge}
                    </span>
                )}
            </button>
        </Link>
    );
}