"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { FilterBar, FilterSelect } from "@/components/list/filter-fields";
import { ListSearch } from "@/components/list/list-search";
import { useUrlFilters } from "@/components/list/use-url-filters";

const FILTER_KEYS = [
    "q",
    "pointId",
    "warehouseId",
    "warehouseCellId",
    "createdBy",
] as const;

interface Option {
    id: string;
    name: string;
}

interface Props {
    points: Option[];
    warehouses: (Option & { pointId: string })[];
    cells: (Option & { warehouseId: string; warehouseName: string })[];
    creators: Option[];
}

export function PromotionFilters({
    points,
    warehouses,
    cells,
    creators,
}: Props) {
    const t = useTranslations("promotion.list");
    const tCommon = useTranslations("common.list");
    const { get, set, setMany, reset, hasActive } = useUrlFilters(FILTER_KEYS);

    const pointId = get("pointId");
    const warehouseId = get("warehouseId");

    const [search, setSearch] = useState(get("q"));

    // Debounce: yozishni tugatgach URL'ga yoziladi
    useEffect(() => {
        const value = search.trim();
        if (value === get("q")) return;
        const timer = window.setTimeout(() => set("q", value), 400);
        return () => window.clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    // Kaskad: point -> sklad -> yacheyka
    const warehouseOptions = useMemo(
        () => (pointId ? warehouses.filter((w) => w.pointId === pointId) : warehouses),
        [warehouses, pointId]
    );

    const cellOptions = useMemo(() => {
        const list = warehouseId
            ? cells.filter((c) => c.warehouseId === warehouseId)
            : pointId
                ? cells.filter((c) =>
                    warehouseOptions.some((w) => w.id === c.warehouseId)
                )
                : cells;

        return list.map((c) => ({
            id: c.id,
            name: warehouseId ? c.name : `${c.warehouseName} / ${c.name}`,
        }));
    }, [cells, warehouseId, pointId, warehouseOptions]);

    return (
        <div className="flex justify-between items-end">
            <FilterBar
                hasActive={hasActive}
                onReset={() => {
                    setSearch("");
                    reset();
                }}
            >
                <FilterSelect
                    label={t("point")}
                    allLabel={tCommon("allPoints")}
                    value={pointId}
                    onChange={(v) =>
                        setMany({ pointId: v, warehouseId: "", warehouseCellId: "" })
                    }
                    options={points}
                />

                <FilterSelect
                    label={t("warehouse")}
                    allLabel={t("allWarehouses")}
                    value={warehouseId}
                    onChange={(v) => setMany({ warehouseId: v, warehouseCellId: "" })}
                    options={warehouseOptions}
                />

                <FilterSelect
                    label={t("cell")}
                    allLabel={t("allCells")}
                    value={get("warehouseCellId")}
                    onChange={(v) => set("warehouseCellId", v)}
                    options={cellOptions}
                />

                <FilterSelect
                    label={tCommon("createdByFilter")}
                    allLabel={tCommon("allUsers")}
                    value={get("createdBy")}
                    onChange={(v) => set("createdBy", v)}
                    options={creators}
                />
            </FilterBar>
            <ListSearch
                value={search}
                onChange={setSearch}
                placeholder={t("searchPlaceholder")}
            />
        </div>
    );
}