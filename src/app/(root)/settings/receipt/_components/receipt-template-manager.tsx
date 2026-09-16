"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Plus, Star, Trash2, Check } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import {
  createReceiptTemplate,
  updateReceiptTemplate,
  deleteReceiptTemplate,
  setDefaultReceiptTemplate,
} from "@/actions/receipt-actions";
import type { IReceiptTemplate, IReceiptData, TotalAlign } from "@/types/receipt.types";
import { Receipt } from "@/components/receipt/receipt";

const SAMPLE_ITEMS = [
  { productName: "Coca-Cola 1.5L", qty: 2, unit: "dona", unitPrice: 18000, lineTotal: 36000 },
  { productName: "Non", qty: 3, unit: "dona", unitPrice: 3000, lineTotal: 9000 },
  { productName: "Sut 1L", qty: 1.5, unit: "l", unitPrice: 14000, lineTotal: 21000 },
];

function buildSample(template: IReceiptTemplate, t: (key: string) => string): IReceiptData {
  const subtotal = SAMPLE_ITEMS.reduce((s, i) => s + i.lineTotal, 0);
  return {
    saleNumber: "000123",
    createdAt: new Date().toISOString(),
    organizationName: t("sampleOrgName"),
    pointName: t("samplePoint"),
    cashierName: t("sampleCashier"),
    paymentMethod: "cash",
    items: SAMPLE_ITEMS,
    subtotal,
    totalAmount: subtotal,
    template,
  };
}

const emptyForm = (name: string, footerText: string) => ({
  name,
  showProductName: true,
  showQty: true,
  showUnit: true,
  showUnitPrice: true,
  showLineTotal: true,
  totalAlign: "right" as TotalAlign,
  headerText: "",
  footerText,
});

type FormState = ReturnType<typeof emptyForm>;

function toForm(t: IReceiptTemplate): FormState {
  return {
    name: t.name,
    showProductName: t.showProductName,
    showQty: t.showQty,
    showUnit: t.showUnit,
    showUnitPrice: t.showUnitPrice,
    showLineTotal: t.showLineTotal,
    totalAlign: t.totalAlign,
    headerText: t.headerText ?? "",
    footerText: t.footerText ?? "",
  };
}

export function ReceiptTemplateManager({
  initialTemplates,
}: {
  initialTemplates: IReceiptTemplate[];
}) {
  const t = useTranslations("settings.receiptTemplates");
  const [templates, setTemplates] = useState(initialTemplates);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialTemplates[0]?.id ?? null
  );
  const [form, setForm] = useState<FormState>(
    initialTemplates[0]
      ? toForm(initialTemplates[0])
      : emptyForm(t("newTemplateName") + " 1", t("sampleFooter"))
  );
  const [isNew, setIsNew] = useState(initialTemplates.length === 0);
  const [pending, startTransition] = useTransition();

  const selected = templates.find((t) => t.id === selectedId) ?? null;

  const selectTemplate = (tpl: IReceiptTemplate) => {
    setSelectedId(tpl.id);
    setForm(toForm(tpl));
    setIsNew(false);
  };

  const startNew = () => {
    setSelectedId(null);
    setForm(emptyForm(`${t("newTemplateName")} ${templates.length + 1}`, t("sampleFooter")));
    setIsNew(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error(t("validation.name"));
      return;
    }

    startTransition(async () => {
      const result = isNew
        ? await createReceiptTemplate(form)
        : await updateReceiptTemplate(selectedId!, form);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      if (isNew) {
        setTemplates((prev) => [...prev, result.data]);
        setSelectedId(result.data.id);
        setIsNew(false);
      } else {
        setTemplates((prev) =>
          prev.map((tpl) => (tpl.id === result.data.id ? result.data : tpl))
        );
      }

      toast.success(t("saved"));
    });
  };

  const handleSetDefault = (id: string) => {
    startTransition(async () => {
      const result = await setDefaultReceiptTemplate(id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setTemplates((prev) => prev.map((tpl) => ({ ...tpl, isDefault: tpl.id === id })));
      toast.success(t("defaultSet"));
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteReceiptTemplate(id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setTemplates((prev) => prev.filter((tpl) => tpl.id !== id));
      if (selectedId === id) startNew();
      toast.success(t("deleted"));
    });
  };

  const previewTemplate: IReceiptTemplate = {
    id: selected?.id ?? "__preview__",
    isDefault: selected?.isDefault ?? false,
    ...form,
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_320px] gap-6 items-start">
      {/* Shablonlar ro'yxati */}
      <Card className="p-3 space-y-1.5">
        {templates.map((tpl) => (
          <button
            key={tpl.id}
            onClick={() => selectTemplate(tpl)}
            className={cn(
              "w-full flex items-center justify-between rounded-md px-2.5 py-2 text-sm text-left transition-colors",
              selectedId === tpl.id && !isNew
                ? "bg-primary/10 text-primary"
                : "hover:bg-muted/60"
            )}
          >
            <span className="truncate flex items-center gap-1.5">
              {tpl.isDefault && (
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
              )}
              {tpl.name}
            </span>
          </button>
        ))}

        <Button
          variant="outline"
          size="sm"
          className="w-full gap-1.5 mt-1"
          onClick={startNew}
        >
          <Plus className="w-3.5 h-3.5" />
          {t("newTemplate")}
        </Button>
      </Card>

      {/* Forma */}
      <Card className="p-5 space-y-4">
        <div className="space-y-1.5">
          <Label>{t("nameLabel")}</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label>{t("columnsLabel")}</Label>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["showProductName", t("columns.name")],
                ["showQty", t("columns.qty")],
                ["showUnit", t("columns.unit")],
                ["showUnitPrice", t("columns.unitPrice")],
                ["showLineTotal", t("columns.lineTotal")],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() =>
                  setForm((f) => ({ ...f, [key]: !f[key] }))
                }
                className={cn(
                  "flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-left",
                  form[key]
                    ? "border-primary bg-primary/5"
                    : "border-border text-muted-foreground"
                )}
              >
                <span
                  className={cn(
                    "w-4 h-4 rounded flex items-center justify-center border shrink-0",
                    form[key] ? "bg-primary border-primary" : "border-border"
                  )}
                >
                  {form[key] && <Check className="w-3 h-3 text-white" />}
                </span>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>{t("totalAlignLabel")}</Label>
          <div className="flex gap-2">
            {(["left", "center", "right"] as TotalAlign[]).map((align) => (
              <button
                key={align}
                type="button"
                onClick={() => setForm((f) => ({ ...f, totalAlign: align }))}
                className={cn(
                  "flex-1 rounded-md border px-3 py-1.5 text-sm capitalize",
                  form.totalAlign === align
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-muted-foreground"
                )}
              >
                {t(`align.${align}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>{t("headerLabel")}</Label>
          <Input
            value={form.headerText}
            onChange={(e) => setForm((f) => ({ ...f, headerText: e.target.value }))}
            placeholder={t("headerPlaceholder")}
          />
        </div>

        <div className="space-y-1.5">
          <Label>{t("footerLabel")}</Label>
          <Input
            value={form.footerText}
            onChange={(e) => setForm((f) => ({ ...f, footerText: e.target.value }))}
            placeholder={t("footerPlaceholder")}
          />
        </div>

        <div className="flex justify-between items-center pt-2">
          <div>
            {!isNew && selected && !selected.isDefault && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive gap-1.5"
                onClick={() => handleDelete(selected.id)}
                disabled={pending}
              >
                <Trash2 className="w-3.5 h-3.5" />
                {t("delete")}
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {!isNew && selected && !selected.isDefault && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSetDefault(selected.id)}
                disabled={pending}
              >
                {t("setDefault")}
              </Button>
            )}
            <Button size="sm" onClick={handleSave} disabled={pending}>
              {pending ? t("saving") : t("save")}
            </Button>
          </div>
        </div>
      </Card>

      <div className="sticky top-4">
        <p className="text-xs text-muted-foreground mb-2 text-center">
          {t("preview")}
        </p>
        <div className="bg-neutral-100 rounded-xl p-4">
          <Receipt data={buildSample(previewTemplate, t)} />
        </div>
      </div>
    </div>
  );
}
