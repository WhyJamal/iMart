"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeftRight, ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteTransfer } from "@/actions/transfer-actions";
import type { TSerializedTransfer } from "@/types/transfer.types";

const fmt = (n: number) => Number(n).toFixed(2) + " сум";
const fmtDate = (d: Date) => new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" }).format(new Date(d));

function TransferRow({ transfer }: { transfer: TSerializedTransfer }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteTransfer(transfer.id);
      if (result.success) {
        toast.success("Перемещение удалено, остатки восстановлены");
        router.refresh();
      } else toast.error(result.error);
    });
  };

  return (
    <>
      <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => setExpanded((v) => !v)}>
        <TableCell className="w-6 text-muted-foreground">{expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</TableCell>
        <TableCell className="font-mono text-sm">{transfer.transferNumber}</TableCell>
        <TableCell>{transfer.fromPoint.name}</TableCell>
        <TableCell><ArrowLeftRight className="w-4 h-4 text-muted-foreground" /></TableCell>
        <TableCell>{transfer.toPoint.name}</TableCell>
        <TableCell><Badge variant="secondary">{transfer.items.length} поз.</Badge></TableCell>
        <TableCell className="font-semibold">{fmt(transfer.totalAmount)}</TableCell>
        <TableCell className="text-muted-foreground text-sm max-w-56 truncate">{transfer.note || "—"}</TableCell>
        <TableCell className="text-muted-foreground text-sm">{fmtDate(transfer.createdAt)}</TableCell>
        <TableCell onClick={(e) => e.stopPropagation()} className="text-right">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" disabled={isPending}><Trash2 className="w-4 h-4" /></Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Удалить перемещение?</AlertDialogTitle>
                <AlertDialogDescription>Остатки по документу <strong>{transfer.transferNumber}</strong> будут восстановлены.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter><AlertDialogCancel>Отмена</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Удалить</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TableCell>
      </TableRow>

      {expanded && (
        <TableRow className="bg-muted/30">
          <TableCell colSpan={10} className="py-0">
            <div className="py-3 px-6">
              <table className="w-full text-sm">
                <thead><tr className="text-xs text-muted-foreground border-b"><th className="text-left pb-1 font-medium">Товар</th><th className="text-left pb-1 font-medium">Откуда</th><th className="text-left pb-1 font-medium">Куда</th><th className="text-right pb-1 font-medium">Количество</th><th className="text-right pb-1 font-medium">Цена</th><th className="text-right pb-1 font-medium">Сумма</th></tr></thead>
                <tbody>{transfer.items.map((item) => <tr key={item.id} className="border-b last:border-0">
                  <td className="py-1.5"><div>{item.product.name}</div><div className="text-xs text-muted-foreground font-mono">{item.product.code}</div></td>
                  <td className="py-1.5 text-muted-foreground">{item.fromCell.name}</td>
                  <td className="py-1.5 text-muted-foreground">{item.toCell.name}</td>
                  <td className="py-1.5 text-right">{item.qty}</td>
                  <td className="py-1.5 text-right">{fmt(item.unitCost)}</td>
                  <td className="py-1.5 text-right font-medium">{fmt(item.qty * item.unitCost)}</td>
                </tr>)}</tbody>
              </table>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export function TransferList({ transfers }: { transfers: TSerializedTransfer[] }) {
  if (!transfers.length) return <div className="text-center py-24 text-muted-foreground"><ArrowLeftRight className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="text-sm">Перемещений пока нет</p></div>;

  return <Table><TableHeader><TableRow>
    <TableHead className="w-6" /><TableHead>Перемещение №</TableHead><TableHead>Откуда</TableHead><TableHead className="w-8" /><TableHead>Куда</TableHead><TableHead>Товары</TableHead><TableHead>Сумма</TableHead><TableHead>Комментарий</TableHead><TableHead>Дата</TableHead><TableHead className="text-right">Действия</TableHead>
  </TableRow></TableHeader><TableBody>{transfers.map((transfer) => <TransferRow key={transfer.id} transfer={transfer} />)}</TableBody></Table>;
}
