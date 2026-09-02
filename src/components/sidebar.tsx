import Link from "next/link";

import { SIDEBARITEMS } from "@/config/sidebar.config";
import { PAGES } from "@/config/pages.config";

import SidebarSection from "./sidebar-section";
import { SidebarNavItem } from "./sidebar-nav-item";
import { getProfile } from "@/actions/user-actions";
import { getServerSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { initials } from "@/utils/initials.util";
import type { TItem } from "@/types/sidebar.types";

export default async function Sidebar() {
    const [user, session] = await Promise.all([getProfile(), getServerSession()]);
    const role = session?.role ?? "CASHIER";

    // Ruxsat berilmagan itemlar HTML'ga umuman qo'shilmaydi —
    // shuning uchun "avval ko'rinib keyin yashiriladi" degan holat
    // (flash of unauthorized content) bo'lmaydi.
    const visible = (items: TItem[]) =>
        items.filter((item) => !item.permission || hasPermission(role, item.permission));

    return (
        <aside className="w-60 bg-white border-r border-gray-100 flex flex-col h-full shadow-[1px_0_16px_rgba(0,0,0,0.04)] shrink-0">
            <nav className="px-2 pt-4 space-y-0.5">
                {visible(SIDEBARITEMS.find((g) => g.groupKey === "top")?.items ?? []).map(
                    (item) => (
                        <SidebarNavItem
                            key={item.id}
                            item={item}
                        />
                    )
                )}
            </nav>

            <div className="flex-1 overflow-y-auto">
                {SIDEBARITEMS.filter((g) => g.groupKey !== "top").map(
                    (section) => (
                        <SidebarSection
                            key={section.groupKey}
                            title={section.groupKey}
                            items={visible(section.items)}
                            defaultOpen={section.defaultOpen}
                        />
                    )
                )}
            </div>

            <Link href={PAGES.PROFILE} className="p-3 border-t border-gray-100">
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-100 transition-colors group">
                    <div className="w-8 h-8 rounded-full bg-red-900 flex items-center justify-center text-white text-xs font-bold">
                        {initials(user.name) || "?"}
                    </div>

                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                            {user.name}
                        </p>

                        <p className="text-[10px] text-gray-400 truncate">
                            {user.email}
                        </p>
                    </div>
                </div>
            </Link>
        </aside>
    );
}