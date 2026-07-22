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
import type { IPayrollPayment } from "@/types/payroll.types";
import { useDeletePayrollPayment } from "../_hooks/use-payroll-mutations";

interface Props {
  payments: IPayrollPayment[];
  canManage: boolean;
}

const fmt = (n: number) => n.toFixed(2) + " сум";
const fmtDate = (d: Date) =>
  new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(d));

export function PayrollList({ payments, canManage }: Props) {
  const router = useRouter();
  const { mutate: remove, isPending } = useDeletePayrollPayment(() =>
    router.refresh()
  );

  if (payments.length === 0) {
    return (
      <div className="text-center py-24 text-muted-foreground">
        <Wallet2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No payroll payments yet</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Employee</TableHead>
          <TableHead>Period</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Units</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Method</TableHead>
          <TableHead>Date</TableHead>
          {canManage && <TableHead className="text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map((p) => (
          <TableRow key={p.id}>
            <TableCell className="font-medium">{p.userName}</TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {fmtDate(p.periodStart)} — {fmtDate(p.periodEnd)}
            </TableCell>
            <TableCell>
              <Badge variant="secondary">{p.salaryType}</Badge>
            </TableCell>
            <TableCell className="text-sm">
              {p.workedUnits !== null ? p.workedUnits : "—"}
            </TableCell>
            <TableCell className="font-semibold">{fmt(p.totalAmount)}</TableCell>
            <TableCell className="text-sm capitalize">{p.paymentMethod}</TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {fmtDate(p.createdAt)}
            </TableCell>
            {canManage && (
              <TableCell className="text-right">
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
                      <AlertDialogTitle>Delete payment?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will reverse the cash movement for this payroll
                        payment. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => remove(p.id)}
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
