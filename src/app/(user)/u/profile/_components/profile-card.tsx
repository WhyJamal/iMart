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
    <div className="rounded-[18px] border border-border bg-card overflow-hidden">
      <div className="px-6 mt-20">
        <div className="-mt-10 relative w-20 h-20">
          <div
            className="w-20 h-20 rounded-full ring-4 ring-card flex items-center justify-center text-white text-3xl font-semibold"
            style={{
              backgroundImage:
                "linear-gradient(to bottom, color-mix(in oklch, var(--primary) 55%, white), var(--primary))",
            }}
          >
            {initials(user.name) || ""}
          </div>

          <button
            disabled
            title={t("avatar.comingSoon")}
            className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground shadow-sm cursor-not-allowed"
          >
            <Camera className="w-3 h-3" />
          </button>
        </div>

        <h2 className="mt-3 text-2xl font-semibold tracking-[-0.01em] text-foreground">
          {user.name}
        </h2>

        {user.organization && (
          <p className="text-xl text-muted-foreground">
            {user.organization.name}
          </p>
        )}
      </div>

      <div className="mt-5 px-6 pb-2 space-y-3">
        <div className="flex items-center gap-2.5">
          <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="text-foreground truncate">
            {user.email}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />

          <span className="text-foreground truncate">
            {user.organization?.name ??
              t("organization.unassigned")}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 ml-0.75" />

          <span className="text-foreground">
            {t("status.active")}
          </span>
        </div>
      </div>

      <div className="border-t border-border mt-5 px-6 py-4">
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
