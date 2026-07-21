"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Wallet, Trash2, ArrowDownLeft, ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

import { deleteCashFlow } from "@/actions/cash-actions";
import type { TCashFlowSerialized } from "@/types/cash.types";

interface Props {
  flows: TCashFlowSerialized[];
}

const fmt = (n: number) => n.toLocaleString("uz-UZ") + " so'm";
const fmtDate = (d: Date) =>
  new Intl.DateTimeFormat("uz-UZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(d));

const DOC_TYPE_LABELS: Record<string, string> = {
  SALE: "Sotuv",
  PURCHASE: "Xarid",
  DEPOSIT: "Kirim",
  WITHDRAWAL: "Chiqim",
  EXPENSE: "Xarajat",
  ADJUSTMENT: "Tuzatish",
};

const METHOD_LABELS: Record<string, string> = {
  CASH: "Naqd",
  CARD: "Karta",
  QR: "QR",
};

function CashFlowRow({ flow }: { flow: TCashFlowSerialized }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isLinked = flow.docType === "SALE" || flow.docType === "PURCHASE";

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteCashFlow(flow.id);
      if (result.success) {
        toast.success("O'chirildi");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <TableRow>
      <TableCell className="w-6">
        {flow.direction === "IN" ? (
          <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
        ) : (
          <ArrowUpRight className="w-4 h-4 text-destructive" />
        )}
      </TableCell>
      <TableCell>
        <Badge variant="secondary">
          {DOC_TYPE_LABELS[flow.docType] ?? flow.docType}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {METHOD_LABELS[flow.method] ?? flow.method}
      </TableCell>
      <TableCell
        className={
          "font-semibold tabular-nums " +
          (flow.direction === "IN" ? "text-emerald-600" : "text-destructive")
        }
      >
        {flow.direction === "IN" ? "+" : "-"}
        {fmt(flow.amount)}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground max-w-60 truncate">
        {flow.note ?? "—"}
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {fmtDate(flow.createdAt)}
      </TableCell>
      <TableCell className="text-right">
        {!isLinked && (
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
                <AlertDialogTitle>Yozuvni o'chirish?</AlertDialogTitle>
                <AlertDialogDescription>
                  Bu harakat kassa balansiga qaytariladi. Ortga qaytarib
                  bo'lmaydi.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  O'chirish
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </TableCell>
    </TableRow>
  );
}

export function CashFlowList({ flows }: Props) {
  if (flows.length === 0) {
    return (
      <div className="text-center py-24 text-muted-foreground">
        <Wallet className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">Hali kassa harakatlari yo'q</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-6" />
          <TableHead>Turi</TableHead>
          <TableHead>Usul</TableHead>
          <TableHead>Summa</TableHead>
          <TableHead>Izoh</TableHead>
          <TableHead>Sana</TableHead>
          <TableHead className="text-right">Amal</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {flows.map((flow) => (
          <CashFlowRow key={flow.id} flow={flow} />
        ))}
      </TableBody>
    </Table>
  );
}