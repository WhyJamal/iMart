import Link from "next/link";

import { SIDEBARITEMS } from "@/config/sidebar.config";
import { PAGES } from "@/config/pages.config";

import SidebarSection from "./sidebar-section";
import { SidebarNavItem } from "./sidebar-nav-item";
import { getProfile } from "@/actions/user-actions";
import { initials } from "@/utils/initials.util";

export default async function Sidebar() {
    const user = await getProfile();
    
    return (
        <aside className="w-60 bg-white border-r border-gray-100 flex flex-col h-full shadow-[1px_0_16px_rgba(0,0,0,0.04)] shrink-0">
            <nav className="px-2 pt-4 space-y-0.5">
                {SIDEBARITEMS.find((g) => g.group === "top")?.items.map(
                    (item) => (
                        <SidebarNavItem
                            key={item.id}
                            item={item}
                        />
                    )
                )}
            </nav>

            <div className="flex-1 overflow-y-auto">
                {SIDEBARITEMS.filter((g) => g.group !== "top").map(
                    (section) => (
                        <SidebarSection
                            key={section.group}
                            title={section.group}
                            items={section.items}
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