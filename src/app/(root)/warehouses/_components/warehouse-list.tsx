"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Warehouse as WarehouseIcon,
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
} from "lucide-react";
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
import type { IWarehouse, IWarehouseStockRow } from "@/types/warehouse.types";
import { getWarehouseStock } from "@/actions/warehouse-actions";
import { PAGES } from "@/config/pages.config";
import { useDeleteWarehouse } from "../_hooks/use-warehouse-mutations";

interface Props {
  warehouses: IWarehouse[];
  canManage: boolean;
}

function WarehouseRow({
  warehouse,
  canManage,
  onDeleted,
}: {
  warehouse: IWarehouse;
  canManage: boolean;
  onDeleted: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [stock, setStock] = useState<IWarehouseStockRow[] | null>(null);
  const [isLoading, startLoading] = useTransition();
  const { mutate: remove, isPending: isDeleting } = useDeleteWarehouse(onDeleted);

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    if (next && stock === null) {
      startLoading(() => {
        void (async () => {
          const result = await getWarehouseStock(warehouse.id);
          setStock(result);
        })();
      });
    }
  };

  return (
    <>
      <TableRow className="cursor-pointer hover:bg-muted/50" onClick={toggle}>
        <TableCell className="w-6 text-muted-foreground">
          {expanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </TableCell>
        <TableCell className="font-medium">{warehouse.name}</TableCell>
        <TableCell>
          <Badge variant="secondary">{warehouse.pointName}</Badge>
        </TableCell>
        <TableCell>
          <Badge variant="secondary">{warehouse.cells.length} yacheyka</Badge>
        </TableCell>
        {canManage && (
          <TableCell
            className="text-right space-x-1"
            onClick={(e) => e.stopPropagation()}
          >
            <Button variant="ghost" size="sm" asChild>
              <Link href={`${PAGES.WAREHOUSES}?edit=${warehouse.id}`}>
                <Pencil className="w-3.5 h-3.5" />
              </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Skladni o'chirish?</AlertDialogTitle>
                  <AlertDialogDescription>
                    <strong>{warehouse.name}</strong> va uning yacheykalari
                    o'chiriladi. Bu amalni bekor qilib bo'lmaydi.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => remove(warehouse.id)}
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

      {expanded && (
        <TableRow className="bg-muted/30">
          <TableCell colSpan={canManage ? 5 : 4} className="py-0">
            <div className="py-3 px-6">
              {isLoading && (
                <p className="text-sm text-muted-foreground">Yuklanmoqda…</p>
              )}
              {!isLoading && stock && stock.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Bu skladda hozircha tovar qoldig'i yo'q
                </p>
              )}
              {!isLoading && stock && stock.length > 0 && (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-muted-foreground border-b">
                      <th className="text-left pb-1 font-medium">Yacheyka</th>
                      <th className="text-left pb-1 font-medium">Mahsulot</th>
                      <th className="text-left pb-1 font-medium">Kod</th>
                      <th className="text-right pb-1 font-medium">Qoldiq</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stock.map((row) => (
                      <tr
                        key={`${row.cellId}:${row.productId}`}
                        className="border-b last:border-0"
                      >
                        <td className="py-1.5">{row.cellName}</td>
                        <td className="py-1.5">{row.productName}</td>
                        <td className="py-1.5 font-mono text-xs text-muted-foreground">
                          {row.productCode}
                        </td>
                        <td className="py-1.5 text-right">{row.qty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export function WarehouseList({ warehouses, canManage }: Props) {
  const router = useRouter();

  if (warehouses.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <WarehouseIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No warehouses yet</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-6" />
          <TableHead>Nomi</TableHead>
          <TableHead>Point</TableHead>
          <TableHead>Yacheykalar</TableHead>
          {canManage && <TableHead className="text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {warehouses.map((w) => (
          <WarehouseRow
            key={w.id}
            warehouse={w}
            canManage={canManage}
            onDeleted={() => router.refresh()}
          />
        ))}
      </TableBody>
    </Table>
  );
}
