"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { initials } from "@/utils/initials.util";
import {
  Camera,
  Mail,
  Building2,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";

interface Props {
  user: {
    id: string;
    name: string;
    email: string;
    organization: {
      id: string;
      name: string;
      logo: string | null;
    } | null;
  };
}

export default function ProfileCard({ user }: Props) {
  const t = useTranslations("profile");

  return (
    <div className="rounded-[18px] border border-[#d2d2d7] bg-white overflow-hidden">
      <div className="px-6 mt-20">
        <div className="-mt-10 relative w-20 h-20">
          <div className="w-20 h-20 rounded-full bg-linear-to-b from-[#ff8a7a] to-[#b91c1c] ring-4 ring-white flex items-center justify-center text-white text-3xl font-semibold">
            {initials(user.name) || ""}
          </div>

          <button
            disabled
            title={t("avatar.comingSoon")}
            className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-white border border-[#d2d2d7] flex items-center justify-center text-[#86868b] shadow-sm cursor-not-allowed"
          >
            <Camera className="w-3 h-3" />
          </button>
        </div>

        <h2 className="mt-3 text-2xl font-semibold tracking-[-0.01em] text-[#1d1d1f]">
          {user.name}
        </h2>

        {user.organization && (
          <p className="text-xl text-[#86868b]">
            {user.organization.name}
          </p>
        )}
      </div>

      <div className="mt-5 px-6 pb-2 space-y-3">
        <div className="flex items-center gap-2.5">
          <Mail className="w-3.5 h-3.5 text-[#86868b] shrink-0" />
          <span className="text-[#1d1d1f] truncate">
            {user.email}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <Building2 className="w-3.5 h-3.5 text-[#86868b] shrink-0" />

          <span className="text-[#1d1d1f] truncate">
            {user.organization?.name ??
              t("organization.unassigned")}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 ml-0.75" />

          <span className="text-[#1d1d1f]">
            {t("status.active")}
          </span>
        </div>
      </div>

      <div className="border-t border-[#d2d2d7] mt-5 px-6 py-4">
        <Button
          onClick={() => signOut({ callbackUrl: "/login" })}
          variant="destructive"
        >
          <LogOut className="w-3.5 h-3.5" />
          {t("buttons.logout")}
        </Button>
      </div>
    </div>
  );
}