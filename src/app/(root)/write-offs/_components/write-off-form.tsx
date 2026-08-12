"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileMinus, Plus, Trash2 } from "lucide-react";
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
import { getCellStockForWriteOff, createWriteOff } from "@/actions/write-off-actions";
import { getWarehouses } from "@/actions/warehouse-actions";
import type { IWarehouse } from "@/types/warehouse.types";
import type { IPointOption } from "@/types/point.types";
import type { IWriteOffStockRow } from "@/types/write-off.types";

interface Props {
  warehouses: IWarehouse[];
  points: IPointOption[];
  defaultPointId: string | null;
}

interface LineItem {
  _key: string;
  warehouseCellId: string;
  productId: string;
  productName: string;
  productCode: string;
  qty: string;
  unitCost: string;
  maxQty: number;
}

export function WriteOffForm({ warehouses: initialWarehouses, points, defaultPointId }: Props) {
  const router = useRouter();
  const [isLoading, startLoading] = useTransition();
  const [isSubmitting, startSubmit] = useTransition();
  const [pointId, setPointId] = useState(defaultPointId ?? "");
  const [warehouses, setWarehouses] = useState<IWarehouse[]>(initialWarehouses);
  const [cellId, setCellId] = useState("");
  const [stock, setStock] = useState<IWriteOffStockRow[]>([]);
  const [reason, setReason] = useState("");
  const [lines, setLines] = useState<LineItem[]>([]);

  // Faqat tanlangan Point'ga tegishli skladlar ishlatiladi.
  // Bu frontenddagi himoya: server ham pointId bo'yicha qayta tekshiradi.
  const visibleWarehouses = warehouses.filter(
    (warehouse) => warehouse.pointId === pointId
  );

  const cells = visibleWarehouses.flatMap((warehouse) =>
    warehouse.cells.map((cell) => ({
      id: cell.id,
      label: `${warehouse.name} — ${cell.name}`,
    }))
  );

  const selectedKeys = new Set(
    lines.filter((line) => line.warehouseCellId === cellId).map((line) => line.productId)
  );

  useEffect(() => {
    setCellId("");
    setStock([]);
    setLines([]);
  }, [pointId]);

  const handlePointChange = (value: string) => {
    setPointId(value);

    if (!value) {
      setWarehouses([]);
      return;
    }

    startLoading(async () => {
      const result = await getWarehouses();
      setWarehouses(result);
    });
  };

  const handleCellChange = (value: string) => {
    setCellId(value);
    setStock([]);
    if (!value || !pointId) return;

    startLoading(async () => {
      const result = await getCellStockForWriteOff(value, pointId);
      setStock(result);
    });
  };

  const addLine = (item: IWriteOffStockRow) => {
    if (selectedKeys.has(item.productId)) return;
    setLines((prev) => [
      ...prev,
      {
        _key: crypto.randomUUID(),
        warehouseCellId: item.cellId,
        productId: item.productId,
        productName: item.productName,
        productCode: item.productCode,
        qty: String(item.qty),
        unitCost: String(item.price),
        maxQty: item.qty,
      },
    ]);
  };

  const removeLine = (key: string) => {
    setLines((prev) => prev.filter((line) => line._key !== key));
  };

  const updateQty = (key: string, value: string, maxQty: number) => {
    const qty = Math.max(0, Math.min(Number(value) || 0, maxQty));
    setLines((prev) => prev.map((line) => (line._key === key ? { ...line, qty: String(qty) } : line)));
  };

  const updateCost = (key: string, value: string) => {
    setLines((prev) => prev.map((line) => (line._key === key ? { ...line, unitCost: value } : line)));
  };

  const totalAmount = lines.reduce(
    (sum, line) => sum + (Number(line.qty) || 0) * (Number(line.unitCost) || 0),
    0
  );

  const handleSubmit = () => {
    const validLines = lines.filter((line) => Number(line.qty) > 0);

    if (!pointId) {
      toast.error("Выберите точку");
      return;
    }
    if (validLines.length === 0) {
      toast.error("Добавьте хотя бы один товар");
      return;
    }
    if (validLines.some((line) => Number(line.qty) > line.maxQty)) {
      toast.error("Количество не может превышать остаток");
      return;
    }

    startSubmit(async () => {
      const result = await createWriteOff({
        pointId,
        reason: reason.trim() || undefined,
        items: validLines.map((line) => ({
          warehouseCellId: line.warehouseCellId,
          productId: line.productId,
          qty: Number(line.qty),
          unitCost: Number(line.unitCost) || 0,
        })),
      });

      if (result.success) {
        toast.success(`Списание ${result.data.writeOffNumber} создано`);
        router.refresh();
        router.back();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <FileMinus className="w-4 h-4" />
          Новое списание
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="space-y-1.5">
          <Label>Точка</Label>
          <Select value={pointId} onValueChange={handlePointChange}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите точку" />
            </SelectTrigger>
            <SelectContent>
              {points.map((point) => (
                <SelectItem key={point.id} value={point.id}>
                  {point.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {pointId && (
          <div className="space-y-1.5">
            <Label>Ячейка склада</Label>
            <Select value={cellId} onValueChange={handleCellChange} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder={isLoading ? "Загрузка…" : "Выберите ячейку"} />
              </SelectTrigger>
              <SelectContent>
                {cells.map((cell) => (
                  <SelectItem key={cell.id} value={cell.id}>
                    {cell.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {cells.length === 0 && !isLoading && (
              <p className="text-xs text-muted-foreground">
                У выбранной точки нет ячеек склада.
              </p>
            )}
          </div>
        )}

        {cellId && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Товары в ячейке</Label>
              {isLoading && <span className="text-xs text-muted-foreground">Загрузка…</span>}
            </div>

            {stock.length === 0 && !isLoading ? (
              <p className="text-sm text-muted-foreground border rounded-md p-4">
                В этой ячейке нет доступного остатка.
              </p>
            ) : (
              <div className="border rounded-md divide-y">
                {stock.map((item) => (
                  <div key={`${item.cellId}:${item.productId}`} className="flex items-center gap-3 px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{item.productName}</div>
                      <div className="text-xs text-muted-foreground font-mono">{item.productCode}</div>
                    </div>
                    <div className="text-sm text-muted-foreground">Остаток: {item.qty}</div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={selectedKeys.has(item.productId)}
                      onClick={() => addLine(item)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Добавить
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
              <div className="grid grid-cols-[1fr_90px_110px_32px] gap-2 text-xs font-medium text-muted-foreground px-1">
                <span>Товар</span>
                <span className="text-right">Количество</span>
                <span className="text-right">Цена</span>
                <span />
              </div>
              {lines.map((line) => (
                <div key={line._key} className="grid grid-cols-[1fr_90px_110px_32px] gap-2 items-center">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{line.productName}</div>
                    <div className="text-xs text-muted-foreground font-mono">{line.productCode}</div>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    max={line.maxQty}
                    step="any"
                    value={line.qty}
                    onChange={(e) => updateQty(line._key, e.target.value, line.maxQty)}
                  />
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={line.unitCost}
                    onChange={(e) => updateCost(line._key, e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => removeLine(line._key)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              <Label>Причина</Label>
              <Input
                placeholder="Например: порча, брак, недостача"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <div className="flex justify-end">
              <dl className="space-y-1 text-sm text-right">
                <div className="flex gap-16 justify-between">
                  <dt className="text-muted-foreground">Позиций</dt>
                  <dd>{lines.length}</dd>
                </div>
                <div className="flex gap-16 justify-between font-semibold text-base">
                  <dt>Сумма списания</dt>
                  <dd>{totalAmount.toFixed(2)} сум</dd>
                </div>
              </dl>
            </div>
          </>
        )}
      </div>

      <div className="p-4 border-t flex justify-end gap-2">
        <Button variant="ghost" onClick={() => router.back()}>
          Отмена
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting || !pointId || lines.length === 0}>
          {isSubmitting ? "Сохранение…" : "Создать списание"}
        </Button>
      </div>
    </div>
  );
}
