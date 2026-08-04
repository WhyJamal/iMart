"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, PackagePlus } from "lucide-react";
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

import { createPurchase, updatePurchase } from "@/actions/purchase-actions";
import type { PurchaseItemInput } from "@/schema/purchase.schema";
import { PAGES } from "@/config/pages.config";
import type { CashMethod } from "@/types/cash.types";
import type { IPointOption } from "@/types/point.types";
import type { IWarehouse } from "@/types/warehouse.types";
import type { IContragentOption } from "@/types/contragent.types";

interface ProductOption {
  id: string;
  name: string;
  code: string;
  price: number;
}

interface Props {
  products: ProductOption[];
  points: IPointOption[];
  warehouses: IWarehouse[];
  contragents: IContragentOption[];
  defaultPointId?: string | null;
  initialData?: any;
  onClose?: () => void;
}

interface LineItem extends Omit<PurchaseItemInput, "qty" | "unitCost"> {
  _key: string;
  qty: string;
  unitCost: string;
}

function newLine(): LineItem {
  return {
    _key: crypto.randomUUID(),
    productId: "",
    qty: "1",
    unitCost: "0",
    warehouseCellId: "",
  };
}

export function PurchaseForm({
  products,
  points,
  warehouses,
  contragents,
  defaultPointId,
  initialData,
  onClose,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [pointId, setPointId] = useState(
    initialData?.pointId ?? defaultPointId ?? ""
  );
  const [contragentId, setContragentId] = useState(
    initialData?.contragentId ?? ""
  );
  const [note, setNote] = useState(initialData?.note ?? "");
  const [paymentMethod, setPaymentMethod] = useState<CashMethod>(initialData?.paymentMethod ?? "CASH");

  const [lines, setLines] = useState<LineItem[]>(
    initialData?.items?.map((item: { productId: string; qty: number; unitCost: number; warehouseCellId?: string }) => ({
      _key: crypto.randomUUID(),
      productId: item.productId,
      qty: String(item.qty),
      unitCost: String(item.unitCost),
      warehouseCellId: item.warehouseCellId ?? "",
    })) ?? [newLine()]
  );

  // Faqat tanlangan Point'ga tegishli skladlar/yacheykalar
  const warehousesForPoint = warehouses.filter((w) => w.pointId === pointId);
  const cellOptions = warehousesForPoint.flatMap((w) =>
    w.cells.map((c) => ({
      id: c.id,
      label: `${w.name} — ${c.name}`,
    }))
  );

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.push(PAGES.PURCHASES);
    }
  };

  const handlePointChange = (value: string) => {
    setPointId(value);
    setLines((prev) => prev.map((l) => ({ ...l, warehouseCellId: "" })));
  };

  const addLine = () => setLines((prev) => [...prev, newLine()]);
  const removeLine = (key: string) =>
    setLines((prev) => prev.filter((l) => l._key !== key));

  const updateLine = <K extends keyof LineItem>(
    key: string,
    field: K,
    value: LineItem[K]
  ) =>
    setLines((prev) =>
      prev.map((l) => (l._key === key ? { ...l, [field]: value } : l))
    );

  const handleProductChange = (key: string, productId: string) => {
    const product = products.find((p) => p.id === productId);
    setLines((prev) =>
      prev.map((l) =>
        l._key === key
          ? { ...l, productId, unitCost: String(product?.price ?? 0) }
          : l
      )
    );
  };

  const totalCost = lines.reduce(
    (sum, l) => sum + (Number(l.qty) || 0) * (Number(l.unitCost) || 0),
    0
  );

  const handleSubmit = () => {
    const validLines = lines.filter((l) => l.productId);

    if (!pointId) {
      toast.error("Nuqtani tanlang");
      return;
    }
    if (!contragentId) {
      toast.error("Sotuvchini (kontragent) tanlang");
      return;
    }
    if (validLines.length === 0) {
      toast.error("Add at least one product");
      return;
    }
    if (validLines.some((l) => !l.warehouseCellId)) {
      toast.error("Har bir qator uchun yacheyka tanlang");
      return;
    }
    if (validLines.some((l) => !(Number(l.qty) > 0))) {
      toast.error("Miqdor 0 dan katta bo'lishi kerak");
      return;
    }

    startTransition(async () => {
      const payload = {
        pointId,
        contragentId,
        note,
        paymentMethod,
        items: validLines.map(({ productId, qty, unitCost, warehouseCellId }) => ({
          productId,
          qty: Number(qty),
          unitCost: Number(unitCost),
          warehouseCellId,
        })),
      };

      const result = initialData
        ? await updatePurchase(initialData.id, payload)
        : await createPurchase(payload);

      if (result.success) {
        toast.success("Saved");
        router.back();
        onClose?.();
      } else {
        router.push(PAGES.PURCHASES);
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="h-full flex flex-col">

      {/* Header */}
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <h2 className="text-base font-semibold">
          {initialData ? "Edit Purchase Receipt" : "New Purchase Receipt"}
        </h2>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Point */}
        <div className="space-y-1.5">
          <Label>Point</Label>
          <Select value={pointId} onValueChange={handlePointChange}>
            <SelectTrigger>
              <SelectValue placeholder="Nuqtani tanlang" />
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

        {/* Contragent (Supplier) & Note */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Sotuvchi (kontragent)</Label>
            <Select value={contragentId} onValueChange={setContragentId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Kontragentni tanlang" />
              </SelectTrigger>
              <SelectContent>
                {contragents.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Note (optional)</Label>
            <Input
              placeholder="Internal note..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>To'lov usuli</Label>
          <Select
            value={paymentMethod}
            onValueChange={(v) => setPaymentMethod(v as CashMethod)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CASH">Naqd</SelectItem>
              <SelectItem value="CARD">Karta</SelectItem>
              {/* <SelectItem value="QR">QR</SelectItem> */}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Lines */}
        <div className="space-y-3">
          <div className="grid grid-cols-[1fr_140px_90px_110px_36px] gap-2 text-xs font-medium text-muted-foreground px-1">
            <span>Product</span>
            <span>Cell</span>
            <span>Qty</span>
            <span>Unit cost</span>
            <span />
          </div>

          {lines.map((line) => (
            <div
              key={line._key}
              className="grid grid-cols-[1fr_140px_90px_110px_36px] gap-2 items-center"
            >
              <Select
                value={line.productId}
                onValueChange={(v) => handleProductChange(line._key, v)}
              >
                <SelectTrigger className="w-full min-w-0">
                  <SelectValue placeholder="Select product" className="truncate" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="font-medium">{p.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {p.code}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={line.warehouseCellId}
                disabled={!pointId || cellOptions.length === 0}
                onValueChange={(v) =>
                  updateLine(line._key, "warehouseCellId", v)
                }
              >
                <SelectTrigger className="w-full min-w-0">
                  <SelectValue placeholder="Yacheyka" className="truncate" />
                </SelectTrigger>
                <SelectContent>
                  {cellOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="number"
                min={0.001}
                step={0.001}
                value={line.qty}
                onChange={(e) =>
                  updateLine(line._key, "qty", e.target.value)
                }
              />

              <Input
                type="number"
                min={0}
                step={0.01}
                value={line.unitCost}
                onChange={(e) =>
                  updateLine(line._key, "unitCost", e.target.value)
                }
              />

              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeLine(line._key)}
                disabled={lines.length === 1}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={addLine}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add line
          </Button>
        </div>

        <Separator />

        {/* Total */}
        <div className="flex justify-end">
          <dl className="space-y-1 text-sm text-right">
            <div className="flex gap-16 justify-between">
              <dt className="text-muted-foreground">Lines</dt>
              <dd>{lines.filter((l) => l.productId).length}</dd>
            </div>
            <div className="flex gap-16 justify-between font-semibold text-base">
              <dt>Total cost</dt>
              <dd>{totalCost.toFixed(2)} сум</dd>
            </div>
          </dl>
        </div>

      </div>

      {/* Footer */}
      <div className="p-4 border-t flex justify-end gap-2">
        <Button variant="ghost" onClick={handleClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending ? "Saving…" : initialData ? "Update purchase" : "Create purchase"}
        </Button>
      </div>

    </div>
  );
}