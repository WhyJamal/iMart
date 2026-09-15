"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Tag, TrendingUp, Check, Percent } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import type { IOrganizationSettings } from "@/types/organization.types";
import type { PricingMode } from "@/schema/organization.schema";
import { updateOrganizationSettings } from "@/actions/organization-actions";

interface Props {
  initialSettings: IOrganizationSettings;
}

export function SettingsForm({ initialSettings }: Props) {
  const t = useTranslations("settings");
  const [pending, startTransition] = useTransition();

  const [pricingMode, setPricingMode] = useState<PricingMode>(
    initialSettings.pricingMode
  );
  const [taxPercent, setTaxPercent] = useState(
    String(initialSettings.taxPercent)
  );

  const isDirty =
    pricingMode !== initialSettings.pricingMode ||
    Number(taxPercent) !== initialSettings.taxPercent;

  const handleSubmit = () => {
    const pct = Number(taxPercent);

    if (!(pct >= 0 && pct <= 100) || Number.isNaN(pct)) {
      toast.error(t("validation.taxPercent"));
      return;
    }

    startTransition(async () => {
      const result = await updateOrganizationSettings({
        pricingMode,
        taxPercent: pct,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(t("success"));
    });
  };

  return (
    <div className="space-y-6">
      {/* Narxlash rejimi */}
      <Card className="p-5 space-y-4">
        <div>
          <h2 className="font-semibold">{t("pricingMode.title")}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("pricingMode.description")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setPricingMode("CATALOG")}
            className={cn(
              "relative text-left rounded-lg border p-4 transition-colors",
              pricingMode === "CATALOG"
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border hover:bg-muted/50"
            )}
          >
            {pricingMode === "CATALOG" && (
              <Check className="w-4 h-4 text-primary absolute top-3 right-3" />
            )}
            <div className="flex items-center gap-2 font-medium">
              <Tag className="w-4 h-4" />
              {t("pricingMode.catalog.title")}
            </div>
            <p className="text-sm text-muted-foreground mt-1.5">
              {t("pricingMode.catalog.description")}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setPricingMode("AVERAGE")}
            className={cn(
              "relative text-left rounded-lg border p-4 transition-colors",
              pricingMode === "AVERAGE"
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border hover:bg-muted/50"
            )}
          >
            {pricingMode === "AVERAGE" && (
              <Check className="w-4 h-4 text-primary absolute top-3 right-3" />
            )}
            <div className="flex items-center gap-2 font-medium">
              <TrendingUp className="w-4 h-4" />
              {t("pricingMode.average.title")}
            </div>
            <p className="text-sm text-muted-foreground mt-1.5">
              {t("pricingMode.average.description")}
            </p>
          </button>
        </div>

        <p className="text-xs text-muted-foreground bg-muted/50 rounded-md p-3">
          {t("pricingMode.note")}
        </p>
      </Card>

      <Card className="p-5 space-y-3">
        <div>
          <h2 className="font-semibold">{t("taxPercent.title")}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("taxPercent.description")}
          </p>
        </div>

        <div className="max-w-50 space-y-1.5">
          <Label>{t("taxPercent.label")}</Label>
          <div className="relative">
            <Input
              type="number"
              min={0}
              max={100}
              step={0.01}
              value={taxPercent}
              onChange={(e) => setTaxPercent(e.target.value)}
              className="pr-9"
            />
            <Percent className="w-4 h-4 text-muted-foreground absolute right-3 top-2.5" />
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={pending || !isDirty}>
          {pending ? t("saving") : t("save")}
        </Button>
      </div>
    </div>
  );
}
