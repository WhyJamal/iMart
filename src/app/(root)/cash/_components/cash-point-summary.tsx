"use client";

import { MapPin } from "lucide-react";

import { useTranslations } from "next-intl";

import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { ICashPointSummary } from "@/types/cash.types";

interface Props {
  rows: ICashPointSummary[];
}

const fmt = (n: number) =>
  n.toLocaleString("uz-UZ") + " so'm";

const tone = (n: number) =>
  n > 0
    ? "text-emerald-600"
    : n < 0
      ? "text-destructive"
      : "text-muted-foreground";

/**
 * Nuqtalar (foyda markazlari) bo'yicha pul oqimi jadvali. Kassa
 * sahifasidagi joriy filtr (sana / nuqta) bu yerga ham ta'sir qiladi.
 */
export function CashPointSummary({ rows }: Props) {
  const t = useTranslations("cash.summary");

  if (rows.length === 0) return null;

  const total = rows.reduce(
    (acc, r) => ({
      totalIn: acc.totalIn + r.totalIn,
      totalOut: acc.totalOut + r.totalOut,
      cashNet: acc.cashNet + (r.cashIn - r.cashOut),
      bankNet: acc.bankNet + (r.bankIn - r.bankOut),
      net: acc.net + r.net,
    }),
    { totalIn: 0, totalOut: 0, cashNet: 0, bankNet: 0, net: 0 }
  );

  return (
    <div className="space-y-2">
      <div>
        <h2 className="text-base font-semibold flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          {t("title")}
        </h2>

        <p className="text-muted-foreground text-xs mt-0.5">
          {t("hint")}
        </p>
      </div>

      <div className="rounded-xl border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("point")}</TableHead>
              <TableHead className="text-right">{t("in")}</TableHead>
              <TableHead className="text-right">{t("out")}</TableHead>
              <TableHead className="text-right">{t("net")}</TableHead>
              <TableHead className="text-right">{t("cash")}</TableHead>
              <TableHead className="text-right">{t("bank")}</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.map((r) => {
              const cashNet = r.cashIn - r.cashOut;
              const bankNet = r.bankIn - r.bankOut;

              return (
                <TableRow key={r.pointId ?? "none"}>
                  <TableCell className="font-medium">
                    {r.pointName ?? (
                      <span className="text-muted-foreground">
                        {t("noPoint")}
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="text-right tabular-nums text-emerald-600">
                    {fmt(r.totalIn)}
                  </TableCell>

                  <TableCell className="text-right tabular-nums text-destructive">
                    {fmt(r.totalOut)}
                  </TableCell>

                  <TableCell
                    className={
                      "text-right tabular-nums font-semibold " +
                      tone(r.net)
                    }
                  >
                    {fmt(r.net)}
                  </TableCell>

                  <TableCell
                    className={
                      "text-right tabular-nums " + tone(cashNet)
                    }
                  >
                    {fmt(cashNet)}
                  </TableCell>

                  <TableCell
                    className={
                      "text-right tabular-nums " + tone(bankNet)
                    }
                  >
                    {fmt(bankNet)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>

          {rows.length > 1 && (
            <TableFooter>
              <TableRow>
                <TableCell className="font-semibold">
                  {t("total")}
                </TableCell>

                <TableCell className="text-right tabular-nums">
                  {fmt(total.totalIn)}
                </TableCell>

                <TableCell className="text-right tabular-nums">
                  {fmt(total.totalOut)}
                </TableCell>

                <TableCell
                  className={
                    "text-right tabular-nums font-semibold " +
                    tone(total.net)
                  }
                >
                  {fmt(total.net)}
                </TableCell>

                <TableCell className="text-right tabular-nums">
                  {fmt(total.cashNet)}
                </TableCell>

                <TableCell className="text-right tabular-nums">
                  {fmt(total.bankNet)}
                </TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    </div>
  );
}
