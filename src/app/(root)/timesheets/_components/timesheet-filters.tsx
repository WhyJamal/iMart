"use client";

import { useTranslations } from "next-intl";
import {
  FilterBar,
  FilterDate,
  FilterSelect,
} from "@/components/list/filter-fields";
import { useUrlFilters } from "@/components/list/use-url-filters";

const FILTER_KEYS = ["pointId", "status", "createdBy", "dateFrom", "dateTo"] as const;

interface Option {
  id: string;
  name: string;
}

interface Props {
  points: Option[];
  creators: Option[];
}

export function TimesheetFilters({ points, creators }: Props) {
  const t = useTranslations("timesheet.list");
  const tCommon = useTranslations("common.list");
  const { get, set, reset, hasActive } = useUrlFilters(FILTER_KEYS);

  const statusOptions = [
    { id: "DRAFT", name: t("draft") },
    { id: "CONFIRMED", name: t("confirmed") },
  ];

  return (
    <FilterBar hasActive={hasActive} onReset={reset}>
      <FilterSelect
        label={t("point")}
        allLabel={tCommon("allPoints")}
        value={get("pointId")}
        onChange={(v) => set("pointId", v)}
        options={points}
      />

      <FilterSelect
        label={t("status")}
        allLabel={tCommon("allStatuses")}
        value={get("status")}
        onChange={(v) => set("status", v)}
        options={statusOptions}
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
