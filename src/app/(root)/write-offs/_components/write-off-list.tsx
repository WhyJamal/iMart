"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronRight,
  FileMinus,
  Trash2,
} from "lucide-react";
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

function WriteOffRow({
  writeOff,
}: {
  writeOff: TSerializedWriteOff;
}) {
  const t = useTranslations("write-off.list");

  const router = useRouter();

  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();

  const fmt = (n: number) =>
    Number(n).toFixed(2) + ` ${t("currency")}`;

  const fmtDate = (d: Date) =>
    new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(d));

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteWriteOff(writeOff.id);

      if (result.success) {
        toast.success(t("deleted"));
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

        <TableCell className="font-mono text-sm">
          {writeOff.writeOffNumber}
        </TableCell>

        <TableCell>{writeOff.point?.name || "—"}</TableCell>

        <TableCell>
          <Badge variant="secondary">
            {writeOff.items.length} {t("itemsShort")}
          </Badge>
        </TableCell>

        <TableCell className="font-semibold">
          {fmt(writeOff.totalAmount)}
        </TableCell>

        <TableCell className="text-muted-foreground text-sm max-w-60 truncate">
          {writeOff.reason || "—"}
        </TableCell>

        <TableCell className="text-muted-foreground text-sm">
          {fmtDate(writeOff.createdAt)}
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
                <AlertDialogTitle>
                  {t("deleteTitle")}
                </AlertDialogTitle>

                <AlertDialogDescription>
                  {t("deleteDescriptionBefore")}{" "}
                  <strong>{writeOff.writeOffNumber}</strong>{" "}
                  {t("deleteDescriptionAfter")}
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel>
                  {t("cancel")}
                </AlertDialogCancel>

                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {t("delete")}
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
                    <th className="text-left pb-1 font-medium">
                      {t("product")}
                    </th>

                    <th className="text-left pb-1 font-medium">
                      {t("cell")}
                    </th>

                    <th className="text-right pb-1 font-medium">
                      {t("quantity")}
                    </th>

                    <th className="text-right pb-1 font-medium">
                      {t("price")}
                    </th>

                    <th className="text-right pb-1 font-medium">
                      {t("amount")}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {writeOff.items.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b last:border-0"
                    >
                      <td className="py-1.5">
                        <div>{item.product.name}</div>

                        <div className="text-xs text-muted-foreground font-mono">
                          {item.product.code}
                        </div>
                      </td>

                      <td className="py-1.5 text-muted-foreground">
                        {item.warehouseCell.name}
                      </td>

                      <td className="py-1.5 text-right">
                        {Number(item.qty)}
                      </td>

                      <td className="py-1.5 text-right">
                        {fmt(Number(item.unitCost))}
                      </td>

                      <td className="py-1.5 text-right font-medium">
                        {fmt(
                          Number(item.qty) *
                            Number(item.unitCost)
                        )}
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

export function WriteOffList({ writeOffs }: Props) {
  const t = useTranslations("write-off.list");

  if (writeOffs.length === 0) {
    return (
      <div className="text-center py-24 text-muted-foreground">
        <FileMinus className="w-10 h-10 mx-auto mb-3 opacity-30" />

        <p className="text-sm">{t("empty")}</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-6" />
          <TableHead>{t("writeOffNumber")}</TableHead>
          <TableHead>{t("point")}</TableHead>
          <TableHead>{t("products")}</TableHead>
          <TableHead>{t("amount")}</TableHead>
          <TableHead>{t("reason")}</TableHead>
          <TableHead>{t("date")}</TableHead>
          <TableHead className="text-right">
            {t("actions")}
          </TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {writeOffs.map((writeOff) => (
          <WriteOffRow
            key={writeOff.id}
            writeOff={writeOff}
          />
        ))}
      </TableBody>
    </Table>
  );
}