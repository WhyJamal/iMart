"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  PackagePlus,
  Trash2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

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

import { deletePurchase } from "@/actions/purchase-actions";

interface PurchaseItem {
  id: string;
  qty: number;
  unitCost: number;
  product: { id: string; name: string; code: string };
}

interface Purchase {
  id: string;
  receiptNumber: string;
  contragentName?: string | null;
  note: string | null;
  postedAt: Date | null;
  createdAt: Date;
  items: PurchaseItem[];
}

interface Props {
  purchases: Purchase[];
}

const fmt = (n: number) => n.toFixed(2) + " сум";
const fmtDate = (d: Date) =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(d));

function PurchaseRow({ purchase }: { purchase: Purchase }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();

  const total = purchase.items.reduce(
    (s, i) => s + Number(i.qty) * Number(i.unitCost),
    0
  );

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deletePurchase(purchase.id);
      if (result.success) {
        toast.success("Purchase deleted");
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
        onDoubleClick={() => router.push(`/purchases?edit=${purchase.id}`)}
      >
        <TableCell className="w-6 text-muted-foreground">
          {expanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </TableCell>
        <TableCell className="font-mono text-sm">
          {purchase.receiptNumber}
        </TableCell>
        <TableCell>{purchase.contragentName ?? "—"}</TableCell>
        <TableCell>
          <Badge variant="secondary">{purchase.items.length} items</Badge>
        </TableCell>
        <TableCell className="font-semibold">{fmt(total)}</TableCell>
        <TableCell className="text-muted-foreground text-sm">
          {fmtDate(purchase.createdAt)}
        </TableCell>
        <TableCell
          onClick={(e) => e.stopPropagation()}
          className="text-right"
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
                <AlertDialogTitle>Delete purchase?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will reverse all inventory movements for{" "}
                  <strong>{purchase.receiptNumber}</strong>. This action cannot
                  be undone.
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
          <TableCell colSpan={7} className="py-0">
            <div className="py-3 px-6">
              {purchase.note && (
                <p className="text-xs text-muted-foreground mb-2 italic">
                  {purchase.note}
                </p>
              )}
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground border-b">
                    <th className="text-left pb-1 font-medium">Product</th>
                    <th className="text-left pb-1 font-medium">Code</th>
                    <th className="text-right pb-1 font-medium">Qty</th>
                    <th className="text-right pb-1 font-medium">Unit cost</th>
                    <th className="text-right pb-1 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {purchase.items.map((item) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-1.5">{item.product.name}</td>
                      <td className="py-1.5 font-mono text-xs text-muted-foreground">
                        {item.product.code}
                      </td>
                      <td className="py-1.5 text-right">{Number(item.qty)}</td>
                      <td className="py-1.5 text-right">
                        {fmt(Number(item.unitCost))}
                      </td>
                      <td className="py-1.5 text-right font-medium">
                        {fmt(Number(item.qty) * Number(item.unitCost))}
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

export function PurchaseList({ purchases }: Props) {
  if (purchases.length === 0) {
    return (
      <div className="text-center py-24 text-muted-foreground">
        <PackagePlus className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No purchases yet</p>
        <Button asChild className="mt-4" size="sm">
          <Link href="/purchases?new=1">Create first purchase</Link>
        </Button>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-6" />
          <TableHead>Receipt #</TableHead>
          <TableHead>Contragent</TableHead>
          <TableHead>Items</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {purchases.map((p) => (
          <PurchaseRow key={p.id} purchase={p} />
        ))}
      </TableBody>
    </Table>
  );
}