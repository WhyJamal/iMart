"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, Undo2, Trash2 } from "lucide-react";
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
import { deleteSaleReturn } from "@/actions/return-actions";
import type { TSerializedSaleReturn } from "@/types/return.types";

interface Props {
  returns: TSerializedSaleReturn[];
}

const fmt = (n: number) => Number(n).toFixed(2) + " сум";
const fmtDate = (d: Date) =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(d));

function ReturnRow({ ret }: { ret: TSerializedSaleReturn }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteSaleReturn(ret.id);
      if (result.success) {
        toast.success("Return deleted and stock/cash reversed");
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
          {expanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </TableCell>
        <TableCell className="font-mono text-sm">{ret.returnNumber}</TableCell>
        <TableCell className="font-mono text-sm text-muted-foreground">
          {ret.sale.saleNumber}
        </TableCell>
        <TableCell>
          <Badge variant="secondary">{ret.items.length} items</Badge>
        </TableCell>
        <TableCell className="font-semibold">{fmt(ret.totalAmount)}</TableCell>
        <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
          {ret.reason || "—"}
        </TableCell>
        <TableCell className="text-muted-foreground text-sm">
          {fmtDate(ret.createdAt)}
        </TableCell>
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
                <AlertDialogTitle>Delete return?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will reverse inventory and cash movements for{" "}
                  <strong>{ret.returnNumber}</strong> — returned stock and
                  refunded cash will be undone. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
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
                    <th className="text-left pb-1 font-medium">Product</th>
                    <th className="text-left pb-1 font-medium">Code</th>
                    <th className="text-right pb-1 font-medium">Qty</th>
                    <th className="text-right pb-1 font-medium">Unit price</th>
                    <th className="text-right pb-1 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {ret.items.map((item) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-1.5">{item.product.name}</td>
                      <td className="py-1.5 font-mono text-xs text-muted-foreground">
                        {item.product.code}
                      </td>
                      <td className="py-1.5 text-right">{Number(item.qty)}</td>
                      <td className="py-1.5 text-right">
                        {fmt(Number(item.unitPrice))}
                      </td>
                      <td className="py-1.5 text-right font-medium">
                        {fmt(Number(item.qty) * Number(item.unitPrice))}
                      </td>
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

export function ReturnList({ returns }: Props) {
  if (returns.length === 0) {
    return (
      <div className="text-center py-24 text-muted-foreground">
        <Undo2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No returns yet</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-6" />
          <TableHead>Return #</TableHead>
          <TableHead>Sale #</TableHead>
          <TableHead>Items</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {returns.map((r) => (
          <ReturnRow key={r.id} ret={r} />
        ))}
      </TableBody>
    </Table>
  );
}
