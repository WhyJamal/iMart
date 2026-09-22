"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { X } from "lucide-react";

import { useTranslations } from "next-intl";

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

import { CASH_NO_POINT } from "@/types/cash.types";
import type { IPointOption } from "@/types/point.types";

const ALL_POINTS = "__all__";

interface Props {
  points: IPointOption[];
}

/**
 * Kassa sahifasi filtri: nuqta (foyda markazi) + sana oralig'i.
 * Holat URL'da saqlanadi (?point=&from=&to=), shuning uchun sahifa
 * server tomonda filtrlanadi va havolani ulashish/yangilash mumkin.
 */
export function CashFilters({ points }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const t = useTranslations("cash.filters");

  const point = searchParams.get("point") ?? ALL_POINTS;
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  const hasFilter = point !== ALL_POINTS || !!from || !!to;

  const update = (key: "point" | "from" | "to", value: string | null) => {
    const next = new URLSearchParams(searchParams.toString());

    // Filtr o'zgarganda ochiq drawer yopiladi
    next.delete("new");

    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }

    const qs = next.toString();
    router.push(qs ? `/cash?${qs}` : "/cash");
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1.5 min-w-52">
        <Label>{t("point")}</Label>

        <Select
          value={point}
          onValueChange={(v) =>
            update("point", v === ALL_POINTS ? null : v)
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value={ALL_POINTS}>
              {t("allPoints")}
            </SelectItem>

            {points.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}

            <SelectItem value={CASH_NO_POINT}>
              {t("noPoint")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>{t("dateFrom")}</Label>

        <Input
          type="date"
          value={from}
          max={to || undefined}
          onChange={(e) => update("from", e.target.value || null)}
        />
      </div>

      <div className="space-y-1.5">
        <Label>{t("dateTo")}</Label>

        <Input
          type="date"
          value={to}
          min={from || undefined}
          onChange={(e) => update("to", e.target.value || null)}
        />
      </div>

      {hasFilter && (
        <Button
          variant="ghost"
          onClick={() => router.push("/cash")}
        >
          <X className="w-4 h-4 mr-1" />
          {t("reset")}
        </Button>
      )}
    </div>
  );
}
