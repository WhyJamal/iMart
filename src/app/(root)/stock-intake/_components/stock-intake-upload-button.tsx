"use client";

import { useRef, useState, useTransition } from "react";
import type { ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { createStockIntake } from "@/actions/stock-intake-actions";
import { readExcelRows } from "@/lib/excel";
import { matchIntakeExcelRows } from "@/lib/stock-intake-import";
import type { IPointOption } from "@/types/point.types";
import type { IWarehouse } from "@/types/warehouse.types";

interface ProductOption {
  id: string;
  name: string;
  code: string;
  unit: string;
}

interface Props {
  products: ProductOption[];
  points: IPointOption[];
  warehouses: IWarehouse[];
  defaultPointId?: string | null;
}

// Ro'yxat sahifasidagi "Excel'dan yuklash" — avval qaysi nuqta va
// qaysi (asosiy) yacheykaga kirim qilinishini so'raydi (bitta kichik
// oyna), keyin fayl tanlanadi va hujjat TO'G'RIDAN-TO'G'RI yaratiladi
// — yangi hujjat ochilib, ko'rib chiqish/tuzatish mumkin bo'ladi.
export function StockIntakeUploadButton({ products, points, warehouses, defaultPointId }: Props) {
  const router = useRouter();
  const t = useTranslations("stock-intake.form");
  const tExport = useTranslations("product.export");
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [pointId, setPointId] = useState(defaultPointId ?? "");
  const [cellId, setCellId] = useState("");

  const cellOptions = warehouses
    .filter((w) => w.pointId === pointId)
    .flatMap((w) => w.cells.map((c) => ({ id: c.id, label: `${w.name} — ${c.name}` })));

  const handlePointChange = (v: string) => {
    setPointId(v);
    setCellId("");
  };

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    try {
      const rows = await readExcelRows(file);
      const { matched, unmatched } = matchIntakeExcelRows(
        rows,
        products.map((p) => ({ id: p.id, code: p.code, name: p.name })),
        {
          code: tExport("code"),
          name: tExport("name"),
          qty: tExport("qty"),
          price: tExport("price"),
        }
      );

      if (unmatched.length > 0) {
        toast.error(t("unmatchedProducts", { list: unmatched.join(", ") }));
      }
      if (matched.length === 0) {
        if (unmatched.length === 0) toast.error(t("emptyFile"));
        return;
      }

      startTransition(async () => {
        const result = await createStockIntake({
          pointId,
          note: "",
          items: matched.map((m) => ({
            productId: m.productId,
            warehouseCellId: cellId,
            qty: m.qty,
            unitCost: m.unitCost,
          })),
        });

        if (!result.success) {
          toast.error(result.error);
          return;
        }

        toast.success(t("loadedRows", { count: matched.length }));
        setOpen(false);
        router.push(`/stock-intake?edit=${result.data.id}`);
      });
    } catch (err) {
      console.error(err);
      toast.error(t("fileReadError"));
    }
  };

  return (
    <>
      <Button
        variant="outline"
        className="gap-1.5"
        onClick={() => setOpen(true)}
      >
        <Upload className="w-4 h-4 text-green-500" />
        {t("uploadExcel")}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("uploadExcel")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>{t("point")}</Label>
              <Select value={pointId} onValueChange={handlePointChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("selectPointPlaceholder")} />
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
              <Label>{t("defaultCell")}</Label>
              <Select value={cellId} disabled={!pointId} onValueChange={setCellId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("cellPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {cellOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFile}
          />

          <DialogFooter>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={!pointId || !cellId || isPending}
            >
              {isPending ? t("saving") : t("chooseFile")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
