"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, PackagePlus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

import { deleteStockIntake } from "@/actions/stock-intake-actions";
import type { IStockIntakeListItem } from "@/types/stock-intake.types";

const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));

function Row({ intake }: { intake: IStockIntakeListItem }) {
  const router = useRouter();
  const t = useTranslations("stock-intake.list");
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteStockIntake(intake.id);
      if (result.success) {
        toast.success(t("deleted"));
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/50"
      onClick={() => router.push(`/stock-intake?edit=${intake.id}`)}
    >
      <TableCell className="font-medium">{intake.number}</TableCell>
      <TableCell>{intake.pointName ?? "—"}</TableCell>
      <TableCell>{intake.itemsCount}</TableCell>
      <TableCell>{intake.totalQty}</TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {fmtDate(intake.createdAt)}
      </TableCell>
      <TableCell onClick={(e) => e.stopPropagation()} className="text-right">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
              <Trash2 className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("deleteConfirmTitle")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("deleteConfirmDescription", { number: intake.number })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={isPending}>
                {t("delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TableCell>
    </TableRow>
  );
}

export function StockIntakeList({ intakes }: { intakes: IStockIntakeListItem[] }) {
  const t = useTranslations("stock-intake.list");

  if (intakes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed rounded-xl">
        <PackagePlus className="w-8 h-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("number")}</TableHead>
          <TableHead>{t("point")}</TableHead>
          <TableHead>{t("itemsCount")}</TableHead>
          <TableHead>{t("totalQty")}</TableHead>
          <TableHead>{t("date")}</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {intakes.map((intake) => (
          <Row key={intake.id} intake={intake} />
        ))}
      </TableBody>
    </Table>
  );
}
