"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DrawerBackdrop } from "@/components/drawer-backdrop";

import {
  Trash2,
  Loader2,
  CheckCircle2,
} from "lucide-react";

import { confirmProductImport } from "../_actions/confirm-import";
import { getWarehouses } from "@/actions/warehouse-actions";
import type { IWarehouse } from "@/types/warehouse.types";
import { toast } from "sonner";

type ExtractedProduct = {
  name: string;
  price: number;
  quantity: number;
  unit: "dona" | "quti" | "kg" | "litr" | "metr";
  warehouseCellId: string;
};

type ProductImportPreviewProps = {
  items: Omit<
    ExtractedProduct,
    "warehouseCellId"
  >[];
  onClose: () => void;
};

export function ProductImportPreview({
  items,
  onClose,
}: ProductImportPreviewProps) {
  const t = useTranslations("product.importPreview");

  const [rows, setRows] = useState<ExtractedProduct[]>(
    items.map((item) => ({
      ...item,
      warehouseCellId: "",
    }))
  );

  const [isPending, startTransition] =
    useTransition();

  const [warehouses, setWarehouses] =
    useState<IWarehouse[]>([]);

  const [isLoadingCells, setIsLoadingCells] =
    useState(true);

  const [bulkCellId, setBulkCellId] = useState("");

  useEffect(() => {
    let cancelled = false;

    getWarehouses()
      .then((data) => {
        if (cancelled) return;

        setWarehouses(data);

        const allCells = data.flatMap(
          (w) => w.cells
        );

        if (allCells.length === 1) {
          setBulkCellId(allCells[0].id);

          setRows((prev) =>
            prev.map((row) => ({
              ...row,
              warehouseCellId: allCells[0].id,
            }))
          );
        }
      })
      .catch(() => {
        if (!cancelled) {
          toast.error(t("warehouseLoadError"));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingCells(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [t]);

  function updateRow(
    index: number,
    field: "name" | "price" | "quantity",
    value: string
  ) {
    setRows((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;

        if (field === "name") {
          return {
            ...row,
            name: value,
          };
        }

        const numeric = Number(value);

        return {
          ...row,
          [field]: Number.isNaN(numeric)
            ? 0
            : numeric,
        };
      })
    );
  }

  function updateRowCell(
    index: number,
    warehouseCellId: string
  ) {
    setRows((prev) =>
      prev.map((row, i) =>
        i === index
          ? { ...row, warehouseCellId }
          : row
      )
    );
  }

  function applyCellToAll(
    warehouseCellId: string
  ) {
    setBulkCellId(warehouseCellId);

    setRows((prev) =>
      prev.map((row) => ({
        ...row,
        warehouseCellId,
      }))
    );
  }

  function removeRow(index: number) {
    setRows((prev) =>
      prev.filter((_, i) => i !== index)
    );
  }

  function handleConfirm() {
    if (rows.length === 0) {
      toast.error(t("emptyError"));
      return;
    }

    const invalid = rows.some(
      (row) => !row.name.trim()
    );

    if (invalid) {
      toast.error(t("nameError"));
      return;
    }

    const missingCell = rows.some(
      (row) => !row.warehouseCellId
    );

    if (missingCell) {
      toast.error(t("cellError"));
      return;
    }

    startTransition(async () => {
      const result =
        await confirmProductImport(rows);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(
        t("success", {
          count: result.data.count,
        })
      );

      onClose();
    });
  }

  const cellOptionGroups = (
    <>
      {warehouses.map((warehouse) => (
        <optgroup
          key={warehouse.id}
          label={`${warehouse.name} (${warehouse.pointName})`}
        >
          {warehouse.cells.map((cell) => (
            <option
              key={cell.id}
              value={cell.id}
            >
              {cell.name}
            </option>
          ))}
        </optgroup>
      ))}
    </>
  );

  return (
    <DrawerBackdrop isOpen={true}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">
              {t("title")}
            </h2>

            <p className="text-sm text-muted-foreground">
              {t("description", {
                count: rows.length,
              })}
            </p>
          </div>
        </div>

        <div className="px-6 py-4 border-b">
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">
            {t("applyToAll")}
          </label>

          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
            value={bulkCellId}
            onChange={(e) =>
              applyCellToAll(e.target.value)
            }
            disabled={
              isPending || isLoadingCells
            }
          >
            <option value="" disabled>
              {isLoadingCells
                ? t("loading")
                : t("selectCell")}
            </option>

            {cellOptionGroups}
          </select>

          {!isLoadingCells &&
            warehouses.every(
              (w) => w.cells.length === 0
            ) && (
              <p className="text-xs text-destructive mt-1.5">
                {t("noCells")}
              </p>
            )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t("empty")}
            </p>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_100px_90px_180px_40px] gap-2 text-xs font-medium text-muted-foreground px-1">
                <span>{t("name")}</span>
                <span>{t("price")}</span>
                <span>{t("quantity")}</span>
                <span>{t("cell")}</span>
                <span></span>
              </div>

              {rows.map((row, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[1fr_100px_90px_180px_40px] gap-2 items-center"
                >
                  <Input
                    value={row.name}
                    onChange={(e) =>
                      updateRow(
                        index,
                        "name",
                        e.target.value
                      )
                    }
                    placeholder={t(
                      "productNamePlaceholder"
                    )}
                  />

                  <Input
                    type="number"
                    value={row.price}
                    onChange={(e) =>
                      updateRow(
                        index,
                        "price",
                        e.target.value
                      )
                    }
                    min={0}
                  />

                  <Input
                    type="number"
                    value={row.quantity}
                    onChange={(e) =>
                      updateRow(
                        index,
                        "quantity",
                        e.target.value
                      )
                    }
                    min={0}
                  />

                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                    value={row.warehouseCellId}
                    onChange={(e) =>
                      updateRowCell(
                        index,
                        e.target.value
                      )
                    }
                    disabled={
                      isPending ||
                      isLoadingCells
                    }
                  >
                    <option value="" disabled>
                      {t("select")}
                    </option>

                    {cellOptionGroups}
                  </select>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      removeRow(index)
                    }
                    disabled={isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending}
          >
            {t("cancel")}
          </Button>

          <Button
            onClick={handleConfirm}
            disabled={
              isPending || rows.length === 0
            }
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}

            {isPending
              ? t("saving")
              : t("confirmSave")}
          </Button>
        </div>
      </div>
    </DrawerBackdrop>
  );
}