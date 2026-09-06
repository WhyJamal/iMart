"use client";

import { useTranslations } from "next-intl";
import { Users } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { DebtPaymentDialog } from "@/components/debt-payment-dialog";
import { DebtHistoryDialog } from "@/components/debt-history-dialog";
import { createDebtorPayment, getDebtorLedger } from "@/actions/debtor-actions";
import type { IDebtor } from "@/types/debtor.types";

interface Props {
  debtors: (IDebtor & { debt: number })[];
}

export function DebtorList({ debtors }: Props) {
  const t = useTranslations("debtor.list");

  if (debtors.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">{t("empty")}</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("name")}</TableHead>
          <TableHead>{t("phone")}</TableHead>
          <TableHead className="text-right">{t("debt")}</TableHead>
          <TableHead className="text-right">{t("actions")}</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {debtors.map((d) => (
          <TableRow key={d.id}>
            <TableCell className="font-medium">{d.name}</TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {d.phone || "—"}
            </TableCell>
            <TableCell className="text-right">
              {d.debt > 0 ? (
                <span className="font-medium text-amber-600">
                  {d.debt.toLocaleString("uz-UZ")} so'm
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell className="text-right space-x-1">
              {d.debt > 0 && (
                <DebtPaymentDialog
                  name={d.name}
                  debt={d.debt}
                  onSubmit={(input) =>
                    createDebtorPayment({ debtorId: d.id, ...input })
                  }
                  labels={{
                    trigger: t("payDebt"),
                    title: t("payDebtTitle"),
                    currentDebt: t("currentDebt"),
                    amount: t("amount"),
                    method: t("method"),
                    note: t("note"),
                    submit: t("submit"),
                    cancel: t("cancel"),
                    cash: t("payCash"),
                    card: t("payCard"),
                    qr: t("payQr"),
                    success: t("paymentSaved"),
                  }}
                />
              )}

              <DebtHistoryDialog
                name={d.name}
                fetchLedger={() => getDebtorLedger(d.id)}
                labels={{
                  trigger: t("history"),
                  title: t("historyTitle"),
                  empty: t("historyEmpty"),
                  debt: t("historyDebt"),
                  payment: t("historyPayment"),
                  balance: t("historyBalance"),
                }}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
