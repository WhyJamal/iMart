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

interface ProductOption {
  id: string;
  name: string;
  code: string;
  price: number;
}

interface Props {
  products: ProductOption[];
  initialData?: any;
  onClose?: () => void;
}

interface LineItem extends PurchaseItemInput {
  _key: string;
}

function newLine(): LineItem {
  return { _key: crypto.randomUUID(), productId: "", qty: 1, unitCost: 0 };
}

export function PurchaseForm({ products, initialData, onClose }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [supplierName, setSupplierName] = useState(
    initialData?.supplierName ?? ""
  );
  const [note, setNote] = useState(initialData?.note ?? "");

  const [lines, setLines] = useState<LineItem[]>(
    initialData?.items?.map((item: LineItem) => ({
      _key: crypto.randomUUID(),
      productId: item.productId,
      qty: Number(item.qty),
      unitCost: Number(item.unitCost),
    })) ?? [newLine()]
  );

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.push("/purchases");
    }
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
          ? { ...l, productId, unitCost: product?.price ?? 0 }
          : l
      )
    );
  };

  const totalCost = lines.reduce(
    (sum, l) => sum + (l.qty || 0) * (l.unitCost || 0),
    0
  );

  const handleSubmit = () => {
    const validLines = lines.filter((l) => l.productId);

    if (validLines.length === 0) {
      toast.error("Add at least one product");
      return;
    }

    startTransition(async () => {
      const payload = {
        supplierName,
        note,
        items: validLines.map(({ productId, qty, unitCost }) => ({
          productId,
          qty: Number(qty),
          unitCost: Number(unitCost),
        })),
      };

      const result = initialData
        ? await updatePurchase(initialData.id, payload)
        : await createPurchase(payload);

      if (result.success) {
        toast.success("Saved");
        router.refresh();
        onClose?.();
      } else {
        router.push("/purchases");
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

        {/* Supplier & Note */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Supplier name (optional)</Label>
            <Input
              placeholder="e.g. ABC Distributors"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
            />
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

        <Separator />

        {/* Lines */}
        <div className="space-y-3">
          <div className="grid grid-cols-[1fr_100px_120px_36px] gap-2 text-xs font-medium text-muted-foreground px-1">
            <span>Product</span>
            <span>Qty</span>
            <span>Unit cost</span>
            <span />
          </div>

          {lines.map((line) => (
            <div
              key={line._key}
              className="grid grid-cols-[1fr_100px_120px_36px] gap-2 items-center"
            >
              <Select
                value={line.productId}
                onValueChange={(v) => handleProductChange(line._key, v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
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

              <Input
                type="number"
                min={0.001}
                step={0.001}
                value={line.qty}
                onChange={(e) =>
                  updateLine(line._key, "qty", Number(e.target.value))
                }
              />

              <Input
                type="number"
                min={0}
                step={0.01}
                value={line.unitCost}
                onChange={(e) =>
                  updateLine(line._key, "unitCost", Number(e.target.value))
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