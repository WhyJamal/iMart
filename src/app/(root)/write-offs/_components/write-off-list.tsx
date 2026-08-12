"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, FileMinus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { deleteWriteOff } from "@/actions/write-off-actions";
import type { TSerializedWriteOff } from "@/types/write-off.types";

interface Props {
  writeOffs: TSerializedWriteOff[];
}

const fmt = (n: number) => Number(n).toFixed(2) + " сум";
const fmtDate = (d: Date) =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(d));

function WriteOffRow({ writeOff }: { writeOff: TSerializedWriteOff }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteWriteOff(writeOff.id);
      if (result.success) {
        toast.success("Списание удалено, остатки восстановлены");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <>
      <TableRow
        className="cursor-pointer hover:bg-muted/50"
        onClick={() => setExpanded((v) => !v)}
      >
        <TableCell className="w-6 text-muted-foreground">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </TableCell>
        <TableCell className="font-mono text-sm">{writeOff.writeOffNumber}</TableCell>
        <TableCell>{writeOff.point?.name || "—"}</TableCell>
        <TableCell>
          <Badge variant="secondary">{writeOff.items.length} поз.</Badge>
        </TableCell>
        <TableCell className="font-semibold">{fmt(writeOff.totalAmount)}</TableCell>
        <TableCell className="text-muted-foreground text-sm max-w-60 truncate">
          {writeOff.reason || "—"}
        </TableCell>
        <TableCell className="text-muted-foreground text-sm">{fmtDate(writeOff.createdAt)}</TableCell>
        <TableCell onClick={(e) => e.stopPropagation()} className="text-right">
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
                <AlertDialogTitle>Удалить списание?</AlertDialogTitle>
                <AlertDialogDescription>
                  Остатки по документу <strong>{writeOff.writeOffNumber}</strong> будут восстановлены. Это действие нельзя отменить.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Отмена</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Удалить
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TableCell>
      </TableRow>

      {expanded && (
        <TableRow className="bg-muted/30">
          <TableCell colSpan={8} className="py-0">
            <div className="py-3 px-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground border-b">
                    <th className="text-left pb-1 font-medium">Товар</th>
                    <th className="text-left pb-1 font-medium">Ячейка</th>
                    <th className="text-right pb-1 font-medium">Количество</th>
                    <th className="text-right pb-1 font-medium">Цена</th>
                    <th className="text-right pb-1 font-medium">Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  {writeOff.items.map((item) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-1.5">
                        <div>{item.product.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{item.product.code}</div>
                      </td>
                      <td className="py-1.5 text-muted-foreground">{item.warehouseCell.name}</td>
                      <td className="py-1.5 text-right">{Number(item.qty)}</td>
                      <td className="py-1.5 text-right">{fmt(Number(item.unitCost))}</td>
                      <td className="py-1.5 text-right font-medium">{fmt(Number(item.qty) * Number(item.unitCost))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export function WriteOffList({ writeOffs }: Props) {
  if (writeOffs.length === 0) {
    return (
      <div className="text-center py-24 text-muted-foreground">
        <FileMinus className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">Списаний пока нет</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-6" />
          <TableHead>Списание №</TableHead>
          <TableHead>Точка</TableHead>
          <TableHead>Товары</TableHead>
          <TableHead>Сумма</TableHead>
          <TableHead>Причина</TableHead>
          <TableHead>Дата</TableHead>
          <TableHead className="text-right">Действия</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {writeOffs.map((writeOff) => (
          <WriteOffRow key={writeOff.id} writeOff={writeOff} />
        ))}
      </TableBody>
    </Table>
  );
}
