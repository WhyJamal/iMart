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
        <header
            className="h-14 w-full border-b border-white/10 bg-size-[16px_16px,100%_100%] flex items-center shrink-0 px-5 gap-4"
            style={{
                // Header doim to'q (dark) fonli — lekin endi ottenkasi
                // foydalanuvchining tanlagan asosiy rangiga (--primary)
                // qarab o'zgaradi. color-mix() bitta rangdan ikkita
                // to'q ottenka hosil qiladi, alohida saqlashning hojati
                // yo'q.
                backgroundImage:
                    "radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to right, color-mix(in oklch, var(--primary) 55%, black), color-mix(in oklch, var(--primary) 25%, black))",
            }}
        >
            <Link href={PAGES.HOME}>
                <div className="flex items-center gap-3 shrink-0 pr-5 h-full">
                    <Image src="/logos/logo.png" alt="iMart" width={24} height={24} />
                    <div>
                        <p className="text-sm font-semibold text-white leading-none">
                            Vol
                        </p>
                        <p
                            className="text-[10px] mt-0.5 tracking-wide"
                            style={{ color: "color-mix(in oklch, var(--primary) 40%, white)" }}
                        >
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

                <div
                    className="w-8 h-8 rounded-full ring-1 ring-white flex items-center justify-center text-white text-xs font-semibold cursor-pointer"
                    style={{
                        backgroundImage:
                            "linear-gradient(to bottom, color-mix(in oklch, var(--primary) 55%, white), var(--primary))",
                    }}
                >
                    {initials(user.name) || "?"}
                </div>
            </div>
        </header>
    );
}