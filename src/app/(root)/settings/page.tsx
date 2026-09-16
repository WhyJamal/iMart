import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Settings2, Receipt as ReceiptIcon } from "lucide-react";
import Link from "next/link";

import { getServerSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { PAGES } from "@/config/pages.config";
import { getOrganizationSettings } from "@/actions/organization-actions";
import { SettingsForm } from "./_components/settings-form";
import { AnnouncementForm } from "./_components/announcement-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getServerSession();

  if (!session || !hasPermission(session.role, "organization:manage")) {
    redirect(PAGES.HOME);
  }

  const t = await getTranslations("settings");
  const settings = await getOrganizationSettings();

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings2 className="w-6 h-6" />
          {t("title")}
        </h1>

        <p className="text-muted-foreground text-sm mt-0.5">
          {t("description")}
        </p>
      </div>

      <SettingsForm initialSettings={settings} />

      <Link
        href="/settings/receipt"
        className="flex items-center gap-3 rounded-xl border p-4 hover:bg-muted/50 transition-colors"
      >
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <ReceiptIcon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-medium text-sm">{t("receiptTemplates.linkTitle")}</p>
          <p className="text-xs text-muted-foreground">
            {t("receiptTemplates.linkDescription")}
          </p>
        </div>
      </Link>

      {/* {hasPermission(session.role, "notifications:broadcast") && (
        <AnnouncementForm />
      )} */}
    </div>
  );
}
