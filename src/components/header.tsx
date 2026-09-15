import { DateTimeNow } from "./date-time-now";
import { HeaderSearch } from "./header-search";
import { NotificationBell } from "./notification-bell";
import Image from "next/image";
import Link from "next/link";
import { PAGES } from "@/config/pages.config";
import { initials } from "@/utils/initials.util";
import { getProfile } from "@/actions/user-actions";

export default async function Header() {
    const user = await getProfile();

    return (
        <header className="h-14 w-full border-b border-white/10 bg-[radial-gradient(circle,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_right,#450a0a,#1f0a0a)] bg-size-[16px_16px,100%_100%] flex items-center shrink-0 px-5 gap-4">
            <Link href={PAGES.HOME}>
                <div className="flex items-center gap-3 shrink-0 pr-5 h-full">
                    <Image src="/logos/logo.png" alt="iMart" width={24} height={24} />
                    <div>
                        <p className="text-sm font-semibold text-white leading-none">
                            Vol
                        </p>
                        <p className="text-[10px] text-red-300 mt-0.5 tracking-wide">
                            Mart
                        </p>
                    </div>
                </div>
            </Link>

            <HeaderSearch />

            <div className="flex-1" />

            <div className="flex items-center gap-2">
                <DateTimeNow color="white" />

                <NotificationBell />

                <div className="w-8 h-8 rounded-full bg-linear-to-b from-[#ff8a7a] to-[#b91c1c] ring-1 ring-white flex items-center justify-center text-white text-xs font-semibold cursor-pointer">
                    {initials(user.name) || "?"}
                </div>
            </div>
        </header>
    );
}