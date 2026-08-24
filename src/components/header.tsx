import { Bell } from "lucide-react";
import { DateTimeNow } from "./date-time-now";
import { HeaderSearch } from "./header-search";
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
                    <Image src="/logos/iMart-logo.png" alt="iMart" width={24} height={24} />
                    <div>
                        <p className="text-sm font-semibold text-white leading-none">
                            iMart
                        </p>
                        <p className="text-[10px] text-white/50 mt-0.5 tracking-wide">
                            Sale Pro
                        </p>
                    </div>
                </div>
            </Link>

            <HeaderSearch />

            <div className="flex-1" />

            <div className="flex items-center gap-2">
                <DateTimeNow color="white" />

                <button className="relative p-2 rounded-xl hover:bg-white/5 transition">
                    <Bell className="w-4.5 h-4.5 text-white/70" />
                    <span className="absolute top-1.5 right-1.5 w-1.75 h-1.75 bg-indigo-500 rounded-full border-2 border-[#111827]" />
                </button>

                <div className="w-8 h-8 rounded-full bg-linear-to-b from-[#ff8a7a] to-[#b91c1c] ring-1 ring-white flex items-center justify-center text-white text-xs font-semibold cursor-pointer">
                    {initials(user.name) || "?"}
                </div>
            </div>
        </header>
    );
}