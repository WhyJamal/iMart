"use client";

import { useEffect, useState } from "react";

import { useTranslations } from "next-intl";

import { CalendarIcon, Loader2, RotateCcw } from "lucide-react";
import { format, parseISO } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { getSalesReport } from "@/actions/reports/sales-report-actions";

import type { ISalesReport } from "@/types/sales-report.types";
import type { IPointOption } from "@/types/point.types";

const ALL = "__all__";

interface Category {
  id: string;
  name: string;
}

interface Props {
  points: IPointOption[];
  categories: Category[];
}

function firstDayOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

const fmtNum = (n: number) =>
  n.toLocaleString("uz-UZ", { maximumFractionDigits: 3 });

const fmtSum = (n: number) => n.toLocaleString("uz-UZ") + " so'm";

/**
 * Sotishlar hisoboti — 1C'dagi "Продажи" / "Валовая прибыль" kabi:
 * davr va (ixtiyoriy) nuqta, kategoriya bo'yicha, har bir mahsulot
 * uchun miqdor, o'rtacha narx, tushum, tannarx va foyda.
 */
export function SalesReportView({ points, categories }: Props) {
  const t = useTranslations("sales-report");

  const [dateFrom, setDateFrom] = useState(firstDayOfMonth());
  const [dateTo, setDateTo] = useState(today());
  const [pointId, setPointId] = useState(ALL);
  const [categoryId, setCategoryId] = useState(ALL);

  const [data, setData] = useState<ISalesReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    getSalesReport({
      dateFrom,
      dateTo,
      pointId: pointId === ALL ? undefined : pointId,
      categoryId: categoryId === ALL ? undefined : categoryId,
    }).then((result) => {
      setLoading(false);
      if (result.success) setData(result.data);
      else setError(result.error);
    });
  }, [dateFrom, dateTo, pointId, categoryId]);

  const hasFilters = pointId !== ALL || categoryId !== ALL;

  const handleReset = () => {
    setPointId(ALL);
    setCategoryId(ALL);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 pt-6">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              {t("dateFrom")}
            </Label>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="h-9 w-37.5 justify-start font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(parseISO(dateFrom), "dd.MM.yyyy")}
                </Button>
              </PopoverTrigger>

              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={parseISO(dateFrom)}
                  onSelect={(date) => {
                    if (date) setDateFrom(format(date, "yyyy-MM-dd"));
                  }}
                  disabled={(date) => date > parseISO(dateTo)}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              {t("dateTo")}
            </Label>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="h-9 w-37.5 justify-start font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(parseISO(dateTo), "dd.MM.yyyy")}
                </Button>
              </PopoverTrigger>

              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={parseISO(dateTo)}
                  onSelect={(date) => {
                    if (date) setDateTo(format(date, "yyyy-MM-dd"));
                  }}
                  disabled={(date) => date < parseISO(dateFrom)}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="min-w-45 space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              {t("filters.point")}
            </Label>
            <Select value={pointId} onValueChange={setPointId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("filters.all")}</SelectItem>
                {points.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-45 space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              {t("filters.category")}
            </Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("filters.all")}</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasFilters && (
            <Button variant="ghost" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-1" />
              {t("filters.reset")}
            </Button>
          )}
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          {t("loading")}
        </div>
      ) : error ? (
        <div className="text-destructive text-sm py-8 text-center">
          {error}
        </div>
      ) : !data || data.rows.length === 0 ? (
        <div className="text-muted-foreground text-sm py-16 text-center">
          {t("empty")}
        </div>
      ) : (
        <div className="rounded-xl border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.product")}</TableHead>
                <TableHead>{t("table.category")}</TableHead>
                <TableHead className="text-right">{t("table.qty")}</TableHead>
                <TableHead>{t("table.unit")}</TableHead>
                <TableHead className="text-right">{t("table.avgPrice")}</TableHead>
                <TableHead className="text-right">{t("table.revenue")}</TableHead>
                <TableHead className="text-right">{t("table.cost")}</TableHead>
                <TableHead className="text-right">{t("table.profit")}</TableHead>
                <TableHead className="text-right">{t("table.margin")}</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {data.rows.map((r) => (
                <TableRow key={r.productId}>
                  <TableCell className="font-medium">
                    {r.productName}
                    <span className="text-muted-foreground text-xs block">
                      {r.productCode}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.categoryName}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {fmtNum(r.qty)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.unit}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {fmtSum(r.avgPrice)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {fmtSum(r.revenue)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {fmtSum(r.cost)}
                  </TableCell>
                  <TableCell
                    className={
                      "text-right tabular-nums font-medium " +
                      (r.profit >= 0 ? "text-emerald-600" : "text-destructive")
                    }
                  >
                    {fmtSum(r.profit)}
                  </TableCell>
                  <TableCell
                    className={
                      "text-right tabular-nums " +
                      (r.marginPct >= 0 ? "text-emerald-600" : "text-destructive")
                    }
                  >
                    {r.marginPct.toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>

            <TableFooter>
              <TableRow>
                <TableCell className="font-semibold">
                  {t("table.total")}
                </TableCell>
                <TableCell />
                <TableCell className="text-right tabular-nums font-semibold">
                  {fmtNum(data.totals.qty)}
                </TableCell>
                <TableCell />
                <TableCell />
                <TableCell className="text-right tabular-nums font-semibold">
                  {fmtSum(data.totals.revenue)}
                </TableCell>
                <TableCell className="text-right tabular-nums font-semibold">
                  {fmtSum(data.totals.cost)}
                </TableCell>
                <TableCell
                  className={
                    "text-right tabular-nums font-semibold " +
                    (data.totals.profit >= 0
                      ? "text-emerald-600"
                      : "text-destructive")
                  }
                >
                  {fmtSum(data.totals.profit)}
                </TableCell>
                <TableCell
                  className={
                    "text-right tabular-nums font-semibold " +
                    (data.totals.marginPct >= 0
                      ? "text-emerald-600"
                      : "text-destructive")
                  }
                >
                  {data.totals.marginPct.toFixed(1)}%
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}
    </div>
  );
}
