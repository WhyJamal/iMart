"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, CheckCircle2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type { IPayrollAccrualDetail } from "@/types/payroll-accrual.types";
import {
  useFillPayrollAccrual,
  useUpdateAccrualLine,
  useConfirmPayrollAccrual,
} from "../../_hooks/use-payroll-accrual-mutations";

const fmt = (n: number) => n.toLocaleString("uz-UZ");

interface Props {
  accrual: IPayrollAccrualDetail;
  canManage: boolean;
}

export function AccrualTable({ accrual, canManage }: Props) {
  const router = useRouter();
  const isDraft = accrual.status === "DRAFT";
  const [editing, setEditing] = useState<Record<string, string>>({});

  const { mutate: fill, isPending: isFilling } = useFillPayrollAccrual(() =>
    router.refresh()
  );
  const { mutate: updateLine, isPending: isSaving } = useUpdateAccrualLine(() =>
    router.refresh()
  );
  const { mutate: confirm, isPending: isConfirming } = useConfirmPayrollAccrual(
    () => router.refresh()
  );

  const total = accrual.lines.reduce((sum, l) => sum + l.payAmount, 0);

  const commitPayAmount = (lineId: string, value: string) => {
    const num = Number(value);
    if (Number.isNaN(num) || num < 0) return;
    updateLine({ lineId, payAmount: num });
    setEditing((prev) => {
      const next = { ...prev };
      delete next[lineId];
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {isDraft && canManage && (
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fill(accrual.id)} disabled={isFilling}>
            <RefreshCw className="w-4 h-4 mr-1" />
            {isFilling ? "To'ldirilmoqda…" : "Заполнить"}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={isConfirming || accrual.lines.length === 0}>
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Записать и закрыть
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hujjatni tasdiqlash?</AlertDialogTitle>
                <AlertDialogDescription>
                  Jami <strong>{fmt(total)} so'm</strong> kassa/bank
                  balansidan chiqariladi. Bu amalni bekor qilib bo'lmaydi
                  (faqat hujjatni o'chirish orqali qaytarish mumkin).
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => confirm(accrual.id)}>
                  Tasdiqlash
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {accrual.lines.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            Hali qatorlar yo'q — "Заполнить"ni bosing
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Xodim</TableHead>
                <TableHead>Tur</TableHead>
                <TableHead className="text-right">Stavka</TableHead>
                <TableHead className="text-right">Ishlagan</TableHead>
                <TableHead className="text-right">Hisoblangan</TableHead>
                <TableHead className="text-right">Oldin to'langan</TableHead>
                <TableHead className="text-right">To'lanadi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accrual.lines.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.userName}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{l.salaryType}</Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm">{fmt(l.rate)}</TableCell>
                  <TableCell className="text-right text-sm">
                    {l.workedUnits !== null ? l.workedUnits : "—"}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {fmt(l.grossAmount)}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {fmt(l.alreadyPaid)}
                  </TableCell>
                  <TableCell className="text-right">
                    {isDraft && canManage ? (
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        className="w-32 h-8 text-right ml-auto"
                        value={editing[l.id] ?? l.payAmount}
                        onChange={(e) =>
                          setEditing((prev) => ({ ...prev, [l.id]: e.target.value }))
                        }
                        onBlur={(e) => commitPayAmount(l.id, e.target.value)}
                        disabled={isSaving}
                      />
                    ) : (
                      <span className="font-semibold">{fmt(l.payAmount)}</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-end px-4 py-3 border-t bg-muted/30">
            <span className="text-sm font-semibold">
              Jami: {fmt(total)} so'm
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
