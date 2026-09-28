"use client";

import { useTranslations } from "next-intl";
import {
  FilterBar,
  FilterDate,
  FilterSelect,
} from "@/components/list/filter-fields";
import { useUrlFilters } from "@/components/list/use-url-filters";

const FILTER_KEYS = ["createdBy", "paymentMethod", "dateFrom", "dateTo"] as const;

interface Props {
  creators: { id: string; name: string }[];
  paymentMethods: string[];
}

export function SaleFilters({ creators, paymentMethods }: Props) {
  const t = useTranslations("sales.list");
  const tCommon = useTranslations("common.list");
  const tMethods = useTranslations("common.methods");
  const { get, set, reset, hasActive } = useUrlFilters(FILTER_KEYS);

  const methodOptions = paymentMethods.map((m) => {
    const key = m as never;
    const name = m === "debt" ? t("debt") : tMethods.has(key) ? tMethods(key) : m;
    return { id: m, name };
  });

  return (
    <FilterBar hasActive={hasActive} onReset={reset}>
      <FilterSelect
        label={t("paymentMethod")}
        allLabel={t("allPaymentMethods")}
        value={get("paymentMethod")}
        onChange={(v) => set("paymentMethod", v)}
        options={methodOptions}
      />

      <FilterSelect
        label={tCommon("createdByFilter")}
        allLabel={tCommon("allUsers")}
        value={get("createdBy")}
        onChange={(v) => set("createdBy", v)}
        options={creators}
      />

      <FilterDate
        label={tCommon("dateFrom")}
        value={get("dateFrom")}
        onChange={(v) => set("dateFrom", v)}
        max={get("dateTo") || undefined}
      />

      <FilterDate
        label={tCommon("dateTo")}
        value={get("dateTo")}
        onChange={(v) => set("dateTo", v)}
        min={get("dateFrom") || undefined}
      />
    </FilterBar>
  );
}