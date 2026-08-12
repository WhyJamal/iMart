"use client";

import { useRouter } from "next/navigation";
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

const MONTH_LABELS = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
];

const fmt = (n: number) => n.toLocaleString("uz-UZ");

interface Props {
  accruals: IPayrollAccrualSummary[];
  canManage: boolean;
}

export function AccrualList({ accruals, canManage }: Props) {
  const router = useRouter();
  const { mutate: remove, isPending } = useDeletePayrollAccrual(() =>
    router.refresh()
  );

  if (accruals.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Wallet2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No documents yet</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Point</TableHead>
          <TableHead>Davr</TableHead>
          <TableHead>Xodimlar</TableHead>
          <TableHead>Summa</TableHead>
          <TableHead>Holat</TableHead>
          {canManage && <TableHead className="text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {accruals.map((a) => (
          <TableRow
            key={a.id}
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => router.push(`${PAGES.PAYROLL}/${a.id}`)}
          >
            <TableCell className="font-medium">{a.pointName}</TableCell>
            <TableCell>
              {MONTH_LABELS[a.month - 1]} {a.year}
            </TableCell>
            <TableCell>
              <Badge variant="secondary">{a.lineCount}</Badge>
            </TableCell>
            <TableCell className="font-semibold">
              {fmt(a.totalPayAmount)} so'm
            </TableCell>
            <TableCell>
              <Badge variant={a.status === "CONFIRMED" ? "default" : "secondary"}>
                {a.status === "CONFIRMED" ? "Tasdiqlangan" : "Qoralama"}
              </Badge>
            </TableCell>
            {canManage && (
              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
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
                      <AlertDialogTitle>Hujjatni o'chirish?</AlertDialogTitle>
                      <AlertDialogDescription>
                        {a.status === "CONFIRMED"
                          ? "Bu hujjat tasdiqlangan — o'chirilsa kassadan chiqqan pul teskari qaytariladi."
                          : "Bu qoralama hujjat, hech qanday pul harakati yo'q."}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => remove(a.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
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
