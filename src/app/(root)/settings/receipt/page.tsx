import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Receipt as ReceiptIcon } from "lucide-react";

import { getServerSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { PAGES } from "@/config/pages.config";
import { getReceiptTemplates } from "@/actions/receipt-actions";
import { ReceiptTemplateManager } from "./_components/receipt-template-manager";

export const dynamic = "force-dynamic";

export default async function ReceiptSettingsPage() {
  const session = await getServerSession();

  if (!session || !hasPermission(session.role, "organization:manage")) {
    redirect(PAGES.HOME);
  }

  const t = await getTranslations("settings.receiptTemplates");
  const templates = await getReceiptTemplates();

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ReceiptIcon className="w-6 h-6" />
          {t("title")}
        </h1>

        <p className="text-muted-foreground text-sm mt-0.5">
          {t("description")}
        </p>
      </div>

      <ReceiptTemplateManager initialTemplates={templates} />
    </div>
  );
}
