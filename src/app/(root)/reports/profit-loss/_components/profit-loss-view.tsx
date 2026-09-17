"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Printer } from "lucide-react";

import { cn } from "@/lib/utils";

import { getProfitLossReport } from "@/actions/reports/profit-loss-actions";
import type { IProfitLossReport } from "@/types/profit-loss.types";
import type { IPointOption } from "@/types/point.types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

function fmt(n: number) {
  return new Intl.NumberFormat("ru-RU").format(Math.round(n));
}

function fmtDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

function firstDayOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

const ALL_POINTS = "__all__";

interface LineProps {
  number?: string;
  label: string;
  value?: number;
  negative?: boolean;
  bold?: boolean;
  shaded?: boolean;
  bordered?: boolean;
  section?: boolean;
}

function Line({
  number,
  label,
  value,
  negative,
  bold,
  shaded,
  bordered,
  section,
}: LineProps) {
  if (section) {
    return (
      <div
        className={cn(
          "grid grid-cols-[55px_1fr_150px] items-center",
          "border-b border-border bg-muted/50",
          "px-3 py-1.5",
          "text-[12px] font-semibold"
        )}
      >
        <span>{number}</span>
        <span>{label}</span>
        <span />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-[55px_1fr_150px] items-center",
        "min-h-8 px-3",
        "border-b border-border/60",
        shaded && "bg-muted/30",
        bordered && "border-t border-border",
        bold && "font-semibold"
      )}
    >
      <span className="text-[12px] text-muted-foreground">
        {number}
      </span>

      <span
        className={cn(
          "text-[13px]",
          bold ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {label}
      </span>

      <span
        className={cn(
          "text-right font-mono tabular-nums text-[13px]",
          negative && "text-muted-foreground",
          bold && "font-semibold text-foreground"
        )}
      >
        {value !== undefined && (
          <>
            {negative ? "−" : ""}
            {fmt(Math.abs(value))}
          </>
        )}
      </span>
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-6 pt-5 pb-1.5">
      <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        {children}
      </span>
    </div>
  );
}

export function ProfitLossView({ points }: { points: IPointOption[] }) {
  const t = useTranslations("profit-loss");

  const [dateFrom, setDateFrom] = useState(firstDayOfMonth());
  const [dateTo, setDateTo] = useState(today());
  const [pointId, setPointId] = useState(ALL_POINTS);
  const [data, setData] = useState<IProfitLossReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getProfitLossReport({ dateFrom, dateTo, pointId: pointId === ALL_POINTS ? undefined : pointId }).then((result) => {
      setLoading(false);
      if (result.success) setData(result.data);
      else setError(result.error);
    });
  }, [dateFrom, dateTo, pointId]);

  const pointName = points.find((p) => p.id === pointId)?.name;
  const margin =
    data && data.netRevenue !== 0 ? (data.netProfit / data.netRevenue) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Filtrlar */}
      <div className="flex flex-wrap items-end gap-3 bg-muted/40 border border-border rounded-md px-4 py-3">
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
                {dateFrom ? format(parseISO(dateFrom), "dd.MM.yyyy") : t("dateFrom")}
              </Button>
            </PopoverTrigger>

            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFrom ? parseISO(dateFrom) : undefined}
                onSelect={(date) => {
                  if (date) {
                    setDateFrom(format(date, "yyyy-MM-dd"));
                  }
                }}
                disabled={(date) =>
                  dateTo ? date > parseISO(dateTo) : false
                }
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
                {dateTo ? format(parseISO(dateTo), "dd.MM.yyyy") : t("dateTo")}
              </Button>
            </PopoverTrigger>

            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateTo ? parseISO(dateTo) : undefined}
                onSelect={(date) => {
                  if (date) {
                    setDateTo(format(date, "yyyy-MM-dd"));
                  }
                }}
                disabled={(date) => {
                  const todayDate = new Date();
                  todayDate.setHours(23, 59, 59, 999);

                  if (date > todayDate) return true;
                  if (dateFrom && date < parseISO(dateFrom)) return true;

                  return false;
                }}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">{t("point")}</Label>
          <Select value={pointId} onValueChange={setPointId}>
            <SelectTrigger className="h-9 w-45">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_POINTS}>{t("allPoints")}</SelectItem>
              {points.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-1.5 ml-auto"
          onClick={() => window.print()}
          disabled={loading || !data}
        >
          <Printer className="w-3.5 h-3.5" />
          {t("print")}
        </Button>
      </div>

      {/* Hisobot */}
      <div
        id="pl-print-area"
        className="bg-card rounded-xl ring-1 ring-foreground/10 overflow-hidden shadow-sm mx-auto"
      >
        {loading ? (
          <div className="h-72 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <p className="text-destructive text-sm p-6">{error}</p>
        ) : (
          data && (
            <div
              id="pl-print-area"
              className="overflow-hidden border border-border bg-card"
            >
              <div className="border-b border-border px-4 py-4">
                <h2 className="text-center text-sm font-semibold uppercase">
                  {t("statementTitle")}
                </h2>

                <p className="mt-1 text-center text-xs text-muted-foreground">
                  {fmtDate(data.dateFrom)} — {fmtDate(data.dateTo)}
                  {" · "}
                  {pointName ?? t("allPoints")}
                </p>
              </div>

              {/* Header */}
              <div className="grid grid-cols-[55px_1fr_150px] border-b border-border bg-muted/70 px-3 py-2 text-[11px] font-semibold uppercase">
                <span>№</span>
                <span>{t("rows.indicator")}</span>
                <span className="text-right">{t("rows.amount")}</span>
              </div>

              {/* Revenue */}
              <Line
                number="1"
                label={t("sections.revenue")}
                section
              />

              <Line
                number="1.1"
                label={t("rows.revenue")}
                value={data.revenue}
              />

              <Line
                number="1.2"
                label={t("rows.returns")}
                value={data.returns}
                negative
              />

              <Line
                number="1.3"
                label={t("rows.netRevenue")}
                value={data.netRevenue}
                bold
                shaded
              />

              {/* Cost */}
              <Line
                number="2"
                label={t("sections.cost")}
                section
              />

              <Line
                number="2.1"
                label={t("rows.cogs")}
                value={data.cogs}
                negative
              />

              <Line
                number="2.2"
                label={t("rows.grossProfit")}
                value={data.grossProfit}
                bold
                shaded
              />

              {/* Expenses */}
              <Line
                number="3"
                label={t("sections.expenses")}
                section
              />

              <Line
                number="3.1"
                label={t("rows.writeOff")}
                value={data.writeOffLoss}
                negative
              />

              <Line
                number="3.2"
                label={t("rows.manualExpenses")}
                value={data.manualExpenses}
                negative
              />

              <Line
                number="3.3"
                label={t("rows.payroll")}
                value={data.payrollExpense}
                negative
              />

              <Line
                number="3.4"
                label={t("rows.totalExpenses")}
                value={data.totalExpenses}
                negative
                bold
                shaded
              />

              {/* Net profit */}
              <div className="grid grid-cols-[55px_1fr_150px] border-t-2 border-foreground/40 bg-muted px-3 py-3">
                <span />

                <div>
                  <p className="text-sm font-bold">
                    {t("rows.netProfit")}
                  </p>

                  <p
                    className={cn(
                      "mt-0.5 text-[11px]",
                      margin >= 0
                        ? "text-emerald-600"
                        : "text-destructive"
                    )}
                  >
                    {t("margin")}: {margin.toFixed(1)}%
                  </p>
                </div>

                <span
                  className={cn(
                    "text-right font-mono text-base font-bold tabular-nums",
                    data.netProfit >= 0
                      ? "text-emerald-600"
                      : "text-destructive"
                  )}
                >
                  {fmt(data.netProfit)}
                </span>
              </div>
            </div>
          )
        )}
      </div>

      <p className="text-xs text-muted-foreground max-w-2xl">{t("note")}</p>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #pl-print-area, #pl-print-area * { visibility: visible; }
          #pl-print-area { position: fixed; top: 0; left: 0; right: 0; box-shadow: none; }
        }
      `}</style>
    </div>
  );
}
