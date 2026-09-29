"use client";

import { useTranslations } from "next-intl";
import {
  FilterBar,
  FilterDate,
  FilterSelect,
} from "@/components/list/filter-fields";
import { useUrlFilters } from "@/components/list/use-url-filters";
import { ROLES } from "@/types/role.types";

const FILTER_KEYS = ["role", "salaryType", "dateFrom", "dateTo"] as const;

export function SalaryFilters() {
  const t = useTranslations("salary.list");
  const tCommon = useTranslations("common.list");
  const { get, set, reset, hasActive } = useUrlFilters(FILTER_KEYS);

  const roleOptions = ROLES.map((r) => ({ id: r, name: r }));

  const salaryTypeOptions = [
    { id: "FIXED", name: t("typeFixed") },
    { id: "DAILY", name: t("typeDaily") },
    { id: "HOURLY", name: t("typeHourly") },
  ];

  return (
    <FilterBar hasActive={hasActive} onReset={reset}>
      <FilterSelect
        label={t("role")}
        allLabel={tCommon("allRoles")}
        value={get("role")}
        onChange={(v) => set("role", v)}
        options={roleOptions}
      />

      <FilterSelect
        label={t("salaryType")}
        allLabel={t("allSalaryTypes")}
        value={get("salaryType")}
        onChange={(v) => set("salaryType", v)}
        options={salaryTypeOptions}
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
