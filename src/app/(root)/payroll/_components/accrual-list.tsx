"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Wallet2, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import type { IPayrollAccrualSummary } from "@/types/payroll-accrual.types";
import { PAGES } from "@/config/pages.config";
import { useDeletePayrollAccrual } from "../_hooks/use-payroll-accrual-mutations";

const MONTH_KEYS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
] as const;

const fmt = (n: number) =>
  n.toLocaleString("uz-UZ");

interface Props {
  accruals: IPayrollAccrualSummary[];
  canManage: boolean;
}

export function AccrualList({
  accruals,
  canManage,
}: Props) {
  const t = useTranslations("payroll.list");
  const months = useTranslations("payroll.months");

  const router = useRouter();

  const { mutate: remove, isPending } =
    useDeletePayrollAccrual(() =>
      router.refresh()
    );

  if (accruals.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Wallet2 className="w-10 h-10 mx-auto mb-3 opacity-30" />

        <p className="text-sm">
          {t("empty")}
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("point")}</TableHead>
          <TableHead>{t("period")}</TableHead>
          <TableHead>{t("employees")}</TableHead>
          <TableHead>{t("amount")}</TableHead>
          <TableHead>{t("status")}</TableHead>

          {canManage && (
            <TableHead className="text-right">
              {t("actions")}
            </TableHead>
          )}
        </TableRow>
      </TableHeader>

      <TableBody>
        {accruals.map((a) => (
          <TableRow
            key={a.id}
            className="cursor-pointer hover:bg-muted/50"
            onClick={() =>
              router.push(
                `${PAGES.PAYROLL}/${a.id}`
              )
            }
          >
            <TableCell className="font-medium">
              {a.pointName}
            </TableCell>

            <TableCell>
              {months(
                MONTH_KEYS[a.month - 1]
              )}{" "}
              {a.year}
            </TableCell>

            <TableCell>
              <Badge variant="secondary">
                {a.lineCount}
              </Badge>
            </TableCell>

            <TableCell className="font-semibold">
              {fmt(a.totalPayAmount)} so'm
            </TableCell>

            <TableCell>
              <Badge
                variant={
                  a.status === "CONFIRMED"
                    ? "default"
                    : "secondary"
                }
              >
                {a.status === "CONFIRMED"
                  ? t("confirmed")
                  : t("draft")}
              </Badge>
            </TableCell>

            {canManage && (
              <TableCell
                className="text-right"
                onClick={(e) =>
                  e.stopPropagation()
                }
              >
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      disabled={isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>

                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {t("deleteTitle")}
                      </AlertDialogTitle>

                      <AlertDialogDescription>
                        {a.status === "CONFIRMED"
                          ? t("confirmedDelete")
                          : t("draftDelete")}
                      </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                      <AlertDialogCancel>
                        {t("cancel")}
                      </AlertDialogCancel>

                      <AlertDialogAction
                        onClick={() =>
                          remove(a.id)
                        }
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {t("delete")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}