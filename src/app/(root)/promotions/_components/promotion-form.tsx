"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Plus, Percent, Trash2, PackageCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { IPointOption } from "@/types/point.types";
import type {
  IWarehouse,
  ICellStockOption,
} from "@/types/warehouse.types";
import type { IProduct } from "@/types/product.types";

import { createPromotion } from "@/actions/promotion-actions";
import { getPointCellStock } from "@/actions/warehouse-actions";

interface Props {
  points: IPointOption[];
  warehouses: IWarehouse[];
  products: IProduct[];
  defaultPointId: string | null;
  initialCellStock: Record<string, ICellStockOption[]>;
}

interface Line {
  key: string;
  productId: string;
}

export function PromotionForm({
  points,
  warehouses: initialWarehouses,
  products,
  defaultPointId,
  initialCellStock,
}: Props) {
  const t = useTranslations("promotion.form");

  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [loadingStock, startStockLoad] = useTransition();

  const [pointId, setPointId] = useState(
    defaultPointId ?? points[0]?.id ?? ""
  );
  const [warehouseId, setWarehouseId] = useState("");
  const [warehouseCellId, setWarehouseCellId] = useState("");
  const [cellStock, setCellStock] =
    useState<Record<string, ICellStockOption[]>>(initialCellStock);

  const [name, setName] = useState("");
  const [discount, setDiscount] = useState("10");

  const [endsAt, setEndsAt] = useState(() => {
    const d = new Date(Date.now() + 86400000);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });

  const [comment, setComment] = useState("");

  const [lines, setLines] = useState<Line[]>([
    { key: crypto.randomUUID(), productId: "" },
  ]);

  const warehouses = useMemo(
    () => initialWarehouses.filter((w) => w.pointId === pointId),
    [initialWarehouses, pointId]
  );

  const selectedWarehouse = warehouses.find((w) => w.id === warehouseId);
  const cells = selectedWarehouse?.cells ?? [];

  const availableProductIds = useMemo(
    () =>
      new Set(
        Object.entries(cellStock)
          .filter(([, opts]) =>
            opts.some(
              (x) =>
                x.warehouseCellId === warehouseCellId && x.available > 0
            )
          )
          .map(([productId]) => productId)
      ),
    [cellStock, warehouseCellId]
  );

  const availableProducts = useMemo(
    () => products.filter((p) => availableProductIds.has(p.id)),
    [products, availableProductIds]
  );

  useEffect(() => {
    setWarehouseId(warehouses[0]?.id ?? "");
  }, [pointId, warehouses]);

  useEffect(() => {
    const nextCells =
      warehouses.find((w) => w.id === warehouseId)?.cells ?? [];

    setWarehouseCellId(nextCells[0]?.id ?? "");
  }, [warehouseId, warehouses]);

  const reloadStock = (nextPointId: string) => {
    startStockLoad(() => {
      void (async () => {
        const result = await getPointCellStock(nextPointId);
        setCellStock(result);
      })();
    });
  };

  const changePoint = (value: string) => {
    setPointId(value);
    setWarehouseId("");
    setWarehouseCellId("");
    setLines([{ key: crypto.randomUUID(), productId: "" }]);
    reloadStock(value);
  };

  const changeCell = (value: string) => {
    setWarehouseCellId(value);
    setLines([{ key: crypto.randomUUID(), productId: "" }]);
  };

  const addLine = () =>
    setLines((p) => [
      ...p,
      { key: crypto.randomUUID(), productId: "" },
    ]);

  const removeLine = (key: string) =>
    setLines((p) =>
      p.length === 1 ? p : p.filter((x) => x.key !== key)
    );

  const updateLine = (key: string, productId: string) =>
    setLines((p) =>
      p.map((x) => (x.key === key ? { ...x, productId } : x))
    );

  const handleSubmit = () => {
    const productIds = lines.map((x) => x.productId).filter(Boolean);

    if (
      !pointId ||
      !warehouseId ||
      !warehouseCellId ||
      !name.trim() ||
      productIds.length === 0
    ) {
      toast.error(t("validation.required"));
      return;
    }

    if (new Set(productIds).size !== productIds.length) {
      toast.error(t("validation.duplicate"));
      return;
    }

    if (!productIds.every((id) => availableProductIds.has(id))) {
      toast.error(t("validation.unavailable"));
      return;
    }

    const pct = Number(discount);

    if (!(pct > 0 && pct <= 100)) {
      toast.error(t("validation.discount"));
      return;
    }

    startTransition(async () => {
      const result = await createPromotion({
        pointId,
        warehouseId,
        warehouseCellId,
        name: name.trim(),
        discountPercent: pct,
        endsAt: new Date(endsAt).toISOString(),
        comment: comment.trim() || undefined,
        productIds,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(t("success"));
      router.push("/promotions");
      router.refresh();
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <Percent className="w-4 h-4" />
          {t("title")}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>{t("point")}</Label>
            <Select value={pointId} onValueChange={changePoint}>
              <SelectTrigger>
                <SelectValue placeholder={t("selectPoint")} />
              </SelectTrigger>
              <SelectContent>
                {points.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{t("warehouse")}</Label>
            <Select
              value={warehouseId}
              onValueChange={setWarehouseId}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("selectWarehouse")} />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{t("cell")}</Label>
            <Select
              value={warehouseCellId}
              onValueChange={changeCell}
              disabled={!warehouseId || loadingStock}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    loadingStock
                      ? t("loading")
                      : t("selectCell")
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {cells.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>{t("promotionName")}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("promotionNamePlaceholder")}
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t("discount")}</Label>
            <div className="relative">
              <Input
                type="number"
                min={0.01}
                max={100}
                step={0.01}
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="pr-9"
              />
              <span className="absolute right-3 top-2.5 text-muted-foreground">
                %
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>{t("endsAt")}</Label>
          <Input
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label>{t("comment")}</Label>
          <Input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t("commentPlaceholder")}
          />
        </div>

        <div className="border-t pt-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{t("productsTitle")}</p>

              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <PackageCheck className="w-3.5 h-3.5" />
                {t("productsDescription")}
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addLine}
              disabled={
                !warehouseCellId || availableProducts.length === 0
              }
            >
              <Plus className="w-4 h-4 mr-1" />
              {t("addLine")}
            </Button>
          </div>

          {lines.map((line, index) => (
            <div
              key={line.key}
              className="grid grid-cols-[1fr_40px] gap-2 items-center"
            >
              <Select
                value={line.productId}
                onValueChange={(v) => updateLine(line.key, v)}
                disabled={
                  !warehouseCellId || availableProducts.length === 0
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t("productPlaceholder", {
                      number: index + 1,
                    })}
                  />
                </SelectTrigger>

                <SelectContent>
                  {availableProducts.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}{" "}
                      <span className="text-xs text-muted-foreground ml-2">
                        {p.code}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeLine(line.key)}
                disabled={lines.length === 1}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ))}

          {warehouseCellId && availableProducts.length === 0 && (
            <p className="text-sm text-amber-600">
              {t("noAvailableProducts")}
            </p>
          )}
        </div>
      </div>

      <div className="p-6 border-t flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => router.back()}
          disabled={pending}
        >
          {t("cancel")}
        </Button>

        <Button
          className="flex-1"
          onClick={handleSubmit}
          disabled={pending || loadingStock}
        >
          {pending ? t("saving") : t("create")}
        </Button>
      </div>
    </div>
  );
}