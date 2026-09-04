"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowLeftRight, Plus, Trash2 } from "lucide-react";

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
import { Separator } from "@/components/ui/separator";

import {
  createTransfer,
  getCellStockForTransfer,
} from "@/actions/transfer-actions";

import type { IPointOption } from "@/types/point.types";
import type { IWarehouse } from "@/types/warehouse.types";
import type { ITransferStockRow } from "@/types/transfer.types";

interface Props {
  points: IPointOption[];
  warehouses: IWarehouse[];
  defaultPointId: string | null;
}

interface LineItem {
  _key: string;
  productId: string;
  productName: string;
  productCode: string;
  qty: string;
  unitCost: string;
  maxQty: number;
}

export function TransferForm({
  points,
  warehouses,
  defaultPointId,
}: Props) {
  const t = useTranslations("transfer.form");

  const router = useRouter();
  const [isLoading, startLoading] = useTransition();
  const [isSubmitting, startSubmit] = useTransition();

  const [fromPointId, setFromPointId] = useState(
    defaultPointId ?? ""
  );
  const [toPointId, setToPointId] = useState(
    defaultPointId ?? ""
  );
  const [fromWarehouseId, setFromWarehouseId] = useState("");
  const [toWarehouseId, setToWarehouseId] = useState("");
  const [fromCellId, setFromCellId] = useState("");
  const [toCellId, setToCellId] = useState("");
  const [stock, setStock] = useState<ITransferStockRow[]>([]);
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<LineItem[]>([]);

  const fromWarehouses = warehouses.filter(
    (w) => w.pointId === fromPointId
  );

  const toWarehouses = warehouses.filter(
    (w) => w.pointId === toPointId
  );

  const fromCells =
    warehouses.find((w) => w.id === fromWarehouseId)?.cells ?? [];

  const toCells =
    warehouses.find((w) => w.id === toWarehouseId)?.cells ?? [];

  const selectedProductIds = new Set(
    lines.map((line) => line.productId)
  );

  useEffect(() => {
    setFromWarehouseId("");
    setFromCellId("");
    setStock([]);
    setLines([]);
  }, [fromPointId]);

  useEffect(() => {
    setToWarehouseId("");
    setToCellId("");
  }, [toPointId]);

  const handleFromWarehouseChange = (value: string) => {
    setFromWarehouseId(value);
    setFromCellId("");
    setStock([]);
    setLines([]);
  };

  const handleToWarehouseChange = (value: string) => {
    setToWarehouseId(value);
    setToCellId("");
  };

  const handleFromCellChange = (value: string) => {
    setFromCellId(value);
    setStock([]);
    setLines([]);

    if (!value || !fromPointId) return;

    startLoading(async () => {
      const result = await getCellStockForTransfer(
        value,
        fromPointId
      );
      setStock(result);
    });
  };

  const addLine = (item: ITransferStockRow) => {
    if (selectedProductIds.has(item.productId)) return;

    setLines((prev) => [
      ...prev,
      {
        _key: crypto.randomUUID(),
        productId: item.productId,
        productName: item.productName,
        productCode: item.productCode,
        qty: String(item.qty),
        unitCost: String(item.price),
        maxQty: item.qty,
      },
    ]);
  };

  const removeLine = (key: string) =>
    setLines((prev) =>
      prev.filter((line) => line._key !== key)
    );

  const updateLine = (
    key: string,
    field: "qty" | "unitCost",
    value: string
  ) => {
    setLines((prev) =>
      prev.map((line) =>
        line._key === key
          ? { ...line, [field]: value }
          : line
      )
    );
  };

  const totalAmount = lines.reduce(
    (sum, line) =>
      sum +
      (Number(line.qty) || 0) *
        (Number(line.unitCost) || 0),
    0
  );

  const handleSubmit = () => {
    const validLines = lines.filter(
      (line) => Number(line.qty) > 0
    );

    if (!fromPointId || !toPointId)
      return toast.error(t("validation.points"));

    if (!fromCellId || !toCellId)
      return toast.error(t("validation.cells"));

    if (fromCellId === toCellId)
      return toast.error(t("validation.sameCell"));

    if (!validLines.length)
      return toast.error(t("validation.products"));

    if (
      validLines.some(
        (line) => Number(line.qty) > line.maxQty
      )
    )
      return toast.error(t("validation.quantity"));

    if (
      validLines.some(
        (line) => Number(line.unitCost) < 0
      )
    )
      return toast.error(t("validation.price"));

    startSubmit(async () => {
      const result = await createTransfer({
        fromPointId,
        toPointId,
        note: note.trim() || undefined,
        items: validLines.map((line) => ({
          productId: line.productId,
          fromCellId,
          toCellId,
          qty: Number(line.qty),
          unitCost: Number(line.unitCost),
        })),
      });

      if (result.success) {
        toast.success(
          t("success", {
            number: result.data.transferNumber,
          })
        );

        router.refresh();
        router.back();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b flex items-center gap-2">
        <ArrowLeftRight className="w-4 h-4" />
        <h2 className="text-base font-semibold">
          {t("title")}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>{t("fromPoint")}</Label>

            <Select
              value={fromPointId}
              onValueChange={setFromPointId}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={t("selectPoint")}
                />
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
            <Label>{t("toPoint")}</Label>

            <Select
              value={toPointId}
              onValueChange={setToPointId}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={t("selectPoint")}
                />
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
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>{t("fromWarehouse")}</Label>

            <Select
              value={fromWarehouseId}
              onValueChange={handleFromWarehouseChange}
              disabled={!fromPointId}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={t("selectWarehouse")}
                />
              </SelectTrigger>

              <SelectContent>
                {fromWarehouses.map((warehouse) => (
                  <SelectItem
                    key={warehouse.id}
                    value={warehouse.id}
                  >
                    {warehouse.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{t("toWarehouse")}</Label>

            <Select
              value={toWarehouseId}
              onValueChange={handleToWarehouseChange}
              disabled={!toPointId}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={t("selectWarehouse")}
                />
              </SelectTrigger>

              <SelectContent>
                {toWarehouses.map((warehouse) => (
                  <SelectItem
                    key={warehouse.id}
                    value={warehouse.id}
                  >
                    {warehouse.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>{t("fromCell")}</Label>

            <Select
              value={fromCellId}
              onValueChange={handleFromCellChange}
              disabled={!fromWarehouseId}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={t("selectCell")}
                />
              </SelectTrigger>

              <SelectContent>
                {fromCells.map((cell) => (
                  <SelectItem
                    key={cell.id}
                    value={cell.id}
                  >
                    {cell.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{t("toCell")}</Label>

            <Select
              value={toCellId}
              onValueChange={setToCellId}
              disabled={!toWarehouseId}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={t("selectCell")}
                />
              </SelectTrigger>

              <SelectContent>
                {toCells.map((cell) => (
                  <SelectItem
                    key={cell.id}
                    value={cell.id}
                  >
                    {cell.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {fromCellId && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>{t("productsInSourceCell")}</Label>

              {isLoading && (
                <span className="text-xs text-muted-foreground">
                  {t("loading")}
                </span>
              )}
            </div>

            {!stock.length && !isLoading ? (
              <p className="text-sm text-muted-foreground border rounded-md p-4">
                {t("noStock")}
              </p>
            ) : (
              <div className="border rounded-md divide-y">
                {stock.map((item) => (
                  <div
                    key={`${item.cellId}:${item.productId}`}
                    className="flex items-center gap-3 px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">
                        {item.productName}
                      </div>

                      <div className="text-xs text-muted-foreground font-mono">
                        {item.productCode}
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {t("stock")}: {item.qty}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {t("averagePrice")}:{" "}
                      {item.price.toFixed(2)}
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={selectedProductIds.has(
                        item.productId
                      )}
                      onClick={() => addLine(item)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      {t("add")}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {lines.length > 0 && (
          <>
            <Separator />

            <div className="space-y-3">
              <div className="grid grid-cols-[1fr_100px_120px_32px] gap-2 text-xs font-medium text-muted-foreground px-1">
                <span>{t("product")}</span>
                <span className="text-right">
                  {t("quantity")}
                </span>
                <span className="text-right">
                  {t("price")}
                </span>
                <span />
              </div>

              {lines.map((line) => (
                <div
                  key={line._key}
                  className="grid grid-cols-[1fr_100px_120px_32px] gap-2 items-center"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      {line.productName}
                    </div>

                    <div className="text-xs text-muted-foreground font-mono">
                      {line.productCode}
                    </div>
                  </div>

                  <Input
                    type="number"
                    min={0.001}
                    max={line.maxQty}
                    step="any"
                    value={line.qty}
                    onChange={(e) =>
                      updateLine(
                        line._key,
                        "qty",
                        e.target.value
                      )
                    }
                  />

                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={line.unitCost}
                    onChange={(e) =>
                      updateLine(
                        line._key,
                        "unitCost",
                        e.target.value
                      )
                    }
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() =>
                      removeLine(line._key)
                    }
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              <Label>{t("comment")}</Label>

              <Input
                placeholder={t("commentPlaceholder")}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <div className="flex justify-end">
              <dl className="space-y-1 text-sm text-right">
                <div className="flex gap-16 justify-between">
                  <dt className="text-muted-foreground">
                    {t("positions")}
                  </dt>
                  <dd>{lines.length}</dd>
                </div>

                <div className="flex gap-16 justify-between font-semibold text-base">
                  <dt>{t("transferAmount")}</dt>
                  <dd>
                    {totalAmount.toFixed(2)} {t("currency")}
                  </dd>
                </div>
              </dl>
            </div>
          </>
        )}
      </div>

      <div className="p-4 border-t flex justify-end gap-2">
        <Button
          variant="ghost"
          onClick={() => router.back()}
        >
          {t("cancel")}
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={
            isSubmitting ||
            !fromCellId ||
            !toCellId ||
            !lines.length
          }
        >
          {isSubmitting
            ? t("saving")
            : t("create")}
        </Button>
      </div>
    </div>
  );
}