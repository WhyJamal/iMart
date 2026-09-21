"use client";

import { useState, useTransition, useRef } from "react";
import type { ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Plus, Trash2, Upload, PackagePlus } from "lucide-react";

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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { createStockIntake, updateStockIntake } from "@/actions/stock-intake-actions";
import { TemplatePreview } from "./template-preview";
import { readExcelRows } from "@/lib/excel";
import { matchIntakeExcelRows } from "@/lib/stock-intake-import";
import { PAGES } from "@/config/pages.config";
import type { IPointOption } from "@/types/point.types";
import type { IWarehouse } from "@/types/warehouse.types";
import type { IStockIntake } from "@/types/stock-intake.types";

interface ProductOption {
  id: string;
  name: string;
  code: string;
  price: number;
  unit: string;
}

interface Props {
  products: ProductOption[];
  points: IPointOption[];
  warehouses: IWarehouse[];
  defaultPointId?: string | null;
  initialData?: IStockIntake;
  onClose?: () => void;
}

interface LineItem {
  _key: string;
  productId: string;
  qty: string;
  unitCost: string; // bo'sh bo'lishi mumkin — narx ixtiyoriy
  warehouseCellId: string;
}

function newLine(cellId = ""): LineItem {
  return {
    _key: crypto.randomUUID(),
    productId: "",
    qty: "1",
    unitCost: "",
    warehouseCellId: cellId,
  };
}

export function StockIntakeForm({
  products,
  points,
  warehouses,
  defaultPointId,
  initialData,
  onClose,
}: Props) {
  const router = useRouter();
  const t = useTranslations("stock-intake.form");
  const tExport = useTranslations("product.export");
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const [pointId, setPointId] = useState(initialData?.pointId ?? defaultPointId ?? "");
  const [note, setNote] = useState(initialData?.note ?? "");

  // Tepadagi "asosiy yacheyka" — tanlansa, HOZIRDA mavjud barcha
  // qatorlarga yozib qo'yiladi (foydalanuvchi keyin xohlagan qatorini
  // o'zi o'zgartirishi mumkin).
  const [defaultCellId, setDefaultCellId] = useState("");

  const [lines, setLines] = useState<LineItem[]>(
    initialData?.items?.length
      ? initialData.items.map((item) => ({
          _key: crypto.randomUUID(),
          productId: item.productId,
          qty: String(item.qty),
          unitCost: item.unitCost !== null ? String(item.unitCost) : "",
          warehouseCellId: item.warehouseCellId,
        }))
      : [newLine()]
  );

  const warehousesForPoint = warehouses.filter((w) => w.pointId === pointId);
  const cellOptions = warehousesForPoint.flatMap((w) =>
    w.cells.map((c) => ({ id: c.id, label: `${w.name} — ${c.name}` }))
  );

  const productMap = new Map(products.map((p) => [p.id, p]));

  const handlePointChange = (value: string) => {
    setPointId(value);
    setDefaultCellId("");
    setLines((prev) => prev.map((l) => ({ ...l, warehouseCellId: "" })));
  };

  const handleDefaultCellChange = (value: string) => {
    setDefaultCellId(value);
    setLines((prev) => prev.map((l) => ({ ...l, warehouseCellId: value })));
  };

  const addLine = () => setLines((prev) => [...prev, newLine(defaultCellId)]);
  const removeLine = (key: string) =>
    setLines((prev) => prev.filter((l) => l._key !== key));

  const updateLine = <K extends keyof LineItem>(key: string, field: K, value: LineItem[K]) => {
    setLines((prev) => prev.map((l) => (l._key === key ? { ...l, [field]: value } : l)));
  };

  const handleClose = () => {
    if (onClose) onClose();
    else router.push(PAGES.STOCK_INTAKE);
  };

  // ─── Excel'dan qayta yuklash — mavjud qatorlarni TOZALAB, yangisini
  // yozadi. Nuqta/asosiy yacheyka allaqachon shu formada tanlangan
  // bo'lgani uchun, matched qatorlarga o'sha yacheyka qo'yiladi.
  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!defaultCellId) {
      toast.error(t("selectCellFirst"));
      return;
    }

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

      setLines(
        matched.map((m) => ({
          _key: crypto.randomUUID(),
          productId: m.productId,
          qty: String(m.qty),
          unitCost: m.unitCost !== null ? String(m.unitCost) : "",
          warehouseCellId: defaultCellId,
        }))
      );
      toast.success(t("loadedRows", { count: matched.length }));
      setUploadModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error(t("fileReadError"));
    }
  };

  const handleSubmit = () => {
    if (!pointId) {
      toast.error(t("selectPoint"));
      return;
    }
    const validLines = lines.filter((l) => l.productId && l.warehouseCellId && Number(l.qty) > 0);
    if (validLines.length === 0) {
      toast.error(t("noValidLines"));
      return;
    }

    const payload = {
      pointId,
      note,
      items: validLines.map((l) => ({
        productId: l.productId,
        warehouseCellId: l.warehouseCellId,
        qty: Number(l.qty),
        unitCost: l.unitCost.trim() === "" ? null : Number(l.unitCost),
      })),
    };

    startTransition(async () => {
      const result = initialData
        ? await updateStockIntake(initialData.id, payload)
        : await createStockIntake(payload);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(t(initialData ? "updated" : "created"));
      router.refresh();
      handleClose();
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-5 py-4 border-b flex items-center gap-2">
        <PackagePlus className="w-5 h-5" />
        <h2 className="font-semibold">
          {initialData ? initialData.number : t("newDocument")}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
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
            <Select
              value={defaultCellId}
              disabled={!pointId || cellOptions.length === 0}
              onValueChange={handleDefaultCellChange}
            >
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
            <p className="text-[11px] text-muted-foreground">{t("defaultCellHint")}</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>{t("note")}</Label>
          <Input value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <Label className="text-sm">{t("linesTitle")}</Label>

          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-emerald-600 hover:text-emerald-700"
            onClick={() => setUploadModalOpen(true)}
          >
            <Upload className="w-3.5 h-3.5" />
            {t("uploadExcel")}
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFileUpload}
          />

          <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("uploadExcel")}</DialogTitle>
              </DialogHeader>

              <div className="py-2 space-y-3">
                <TemplatePreview products={products} />

                {!defaultCellId && (
                  <p className="text-xs text-destructive">{t("selectCellFirst")}</p>
                )}
              </div>

              <DialogFooter>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!defaultCellId}
                >
                  {t("chooseFile")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_90px_120px_110px_36px] gap-2 text-xs font-medium text-muted-foreground px-1">
            <span>{t("product")}</span>
            <span>{t("unit")}</span>
            <span>{t("cell")}</span>
            <span>{t("qty")} / {t("price")}</span>
            <span />
          </div>

          {lines.map((line) => {
            const product = productMap.get(line.productId);
            return (
              <div
                key={line._key}
                className="grid grid-cols-[1fr_90px_120px_110px_36px] gap-2 items-center"
              >
                <Select
                  value={line.productId}
                  onValueChange={(v) => updateLine(line._key, "productId", v)}
                >
                  <SelectTrigger className="w-full min-w-0">
                    <SelectValue placeholder={t("selectProduct")} className="truncate" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="font-medium">{p.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{p.code}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* O'lchov birligi — nomenklaturadan avtomatik keladi,
                    o'zgartirib bo'lmaydi. */}
                <span className="text-sm text-muted-foreground text-center">
                  {product?.unit ?? "—"}
                </span>

                <Select
                  value={line.warehouseCellId}
                  disabled={!pointId || cellOptions.length === 0}
                  onValueChange={(v) => updateLine(line._key, "warehouseCellId", v)}
                >
                  <SelectTrigger className="w-full min-w-0">
                    <SelectValue placeholder={t("cellPlaceholder")} className="truncate" />
                  </SelectTrigger>
                  <SelectContent>
                    {cellOptions.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="space-y-1">
                  <Input
                    type="number"
                    min={0.001}
                    step={0.001}
                    value={line.qty}
                    onChange={(e) => updateLine(line._key, "qty", e.target.value)}
                    placeholder={t("qty")}
                  />
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={line.unitCost}
                    onChange={(e) => updateLine(line._key, "unitCost", e.target.value)}
                    placeholder={t("priceOptional")}
                  />
                </div>

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
            );
          })}

          <Button variant="outline" size="sm" onClick={addLine} className="w-full">
            <Plus className="w-4 h-4 mr-1" />
            {t("addLine")}
          </Button>
        </div>
      </div>

      <div className="border-t px-5 py-3 flex justify-end gap-2">
        <Button variant="outline" onClick={handleClose} disabled={isPending}>
          {t("cancel")}
        </Button>
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending ? t("saving") : t("save")}
        </Button>
      </div>
    </div>
  );
}
