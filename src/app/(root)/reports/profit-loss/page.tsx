import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { TrendingUp } from "lucide-react";

import { getServerSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { PAGES } from "@/config/pages.config";
import { getPointOptions } from "@/actions/point-actions";
import { ProfitLossView } from "./_components/profit-loss-view";

export const dynamic = "force-dynamic";

export default async function ProfitLossPage() {
  const session = await getServerSession();

  if (!session || !hasPermission(session.role, "reports:read")) {
    redirect(PAGES.HOME);
  }

  const t = await getTranslations("profit-loss");
  const points = await getPointOptions();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="w-6 h-6" />
          {t("title")}
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {t("description")}
        </p>
      </div>

      <ProfitLossView points={points} />
    </div>
  );
}
