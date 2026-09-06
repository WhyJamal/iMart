import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { getServerSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { getDebtors } from "@/actions/debtor-actions";
import { PAGES } from "@/config/pages.config";

import { DebtorList } from "./_components/debtor-list";

export const dynamic = "force-dynamic";

export default async function DebtorsPage() {
  const session = await getServerSession();

  if (!session || !hasPermission(session.role, "debts:manage")) {
    redirect(PAGES.HOME);
  }

  const debtors = await getDebtors();
  const t = await getTranslations("debtor");

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {t("description")}
        </p>
      </div>

      <DebtorList debtors={debtors} />
    </div>
  );
}
