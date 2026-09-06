import { getTranslations } from "next-intl/server";

import { getDebtors } from "@/actions/debtor-actions";
import { getContragents } from "@/actions/contragent-actions";

export const dynamic = "force-dynamic";

const fmt = (n: number) => n.toLocaleString("uz-UZ") + " so'm";

export default async function DebtReportPage() {
  const t = await getTranslations("debt-report");

  const [debtors, contragents] = await Promise.all([
    getDebtors(),
    getContragents(),
  ]);

  const debtorsWithDebt = debtors
    .filter((d) => d.debt > 0)
    .sort((a, b) => b.debt - a.debt);

  const suppliersWithDebt = contragents
    .filter((c) => c.type === "SUPPLIER" && c.debt > 0)
    .sort((a, b) => b.debt - a.debt);

  const totalOwedToUs = debtorsWithDebt.reduce((sum, d) => sum + d.debt, 0);
  const totalWeOwe = suppliersWithDebt.reduce((sum, c) => sum + c.debt, 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {t("description")}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Bizga qarzdorlar (mijozlar) */}
        <div className="bg-white rounded-2xl shadow-sm border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{t("owedToUs.title")}</h2>
            <span className="text-lg font-bold text-emerald-600">
              {fmt(totalOwedToUs)}
            </span>
          </div>

          {debtorsWithDebt.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              {t("owedToUs.empty")}
            </p>
          ) : (
            <div className="space-y-2">
              {debtorsWithDebt.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between text-sm py-1.5 border-b last:border-0"
                >
                  <span>{d.name}</span>
                  <span className="font-medium text-emerald-600">
                    {fmt(d.debt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Biz qarzdormiz (yetkazib beruvchilar) */}
        <div className="bg-white rounded-2xl shadow-sm border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{t("weOwe.title")}</h2>
            <span className="text-lg font-bold text-amber-600">
              {fmt(totalWeOwe)}
            </span>
          </div>

          {suppliersWithDebt.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              {t("weOwe.empty")}
            </p>
          ) : (
            <div className="space-y-2">
              {suppliersWithDebt.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between text-sm py-1.5 border-b last:border-0"
                >
                  <span>{c.name}</span>
                  <span className="font-medium text-amber-600">
                    {fmt(c.debt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
