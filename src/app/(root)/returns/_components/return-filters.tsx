"use client";

import { useTranslations } from "next-intl";
import {
  FilterBar,
  FilterDate,
  FilterSelect,
} from "@/components/list/filter-fields";
import { useUrlFilters } from "@/components/list/use-url-filters";

const FILTER_KEYS = ["createdBy", "dateFrom", "dateTo"] as const;

interface Option {
  id: string;
  name: string;
}

interface Props {
  creators: Option[];
}

export function ReturnFilters({ creators }: Props) {
  const tCommon = useTranslations("common.list");
  const { get, set, reset, hasActive } = useUrlFilters(FILTER_KEYS);

  return (
    <FilterBar hasActive={hasActive} onReset={reset}>
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