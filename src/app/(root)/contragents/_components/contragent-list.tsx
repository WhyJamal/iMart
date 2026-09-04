"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Handshake, Pencil, Trash2 } from "lucide-react";

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

import type { IContragent } from "@/types/contragent.types";
import { PAGES } from "@/config/pages.config";
import { useDeleteContragent } from "../_hooks/use-contragent-mutations";

interface Props {
  contragents: IContragent[];
  canManage: boolean;
}

export function ContragentList({ contragents, canManage }: Props) {
  const router = useRouter();
  const t = useTranslations("contragent.list");

  const { mutate: remove, isPending } = useDeleteContragent(() =>
    router.refresh()
  );

  if (contragents.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Handshake className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">{t("empty")}</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("name")}</TableHead>
          <TableHead>{t("inn")}</TableHead>
          <TableHead>{t("type")}</TableHead>
          <TableHead>{t("phone")}</TableHead>
          <TableHead>{t("purchases")}</TableHead>
          {canManage && (
            <TableHead className="text-right">
              {t("actions")}
            </TableHead>
          )}
        </TableRow>
      </TableHeader>

      <TableBody>
        {contragents.map((c) => (
          <TableRow key={c.id}>
            <TableCell className="font-medium">{c.name}</TableCell>

            <TableCell className="text-sm text-muted-foreground">
              {c.inn || "—"}
            </TableCell>

            <TableCell>
              <Badge
                variant={
                  c.type === "SUPPLIER" ? "default" : "secondary"
                }
              >
                {c.type === "SUPPLIER"
                  ? t("supplier")
                  : t("buyer")}
              </Badge>
            </TableCell>

            <TableCell className="text-sm text-muted-foreground">
              {c.phone || "—"}
            </TableCell>

            <TableCell>
              <Badge variant="secondary">{c.purchaseCount}</Badge>
            </TableCell>

            {canManage && (
              <TableCell className="text-right space-x-1">
                <Button variant="ghost" size="sm" asChild>
                  <Link
                    href={`${PAGES.CONTRAGENTS}?edit=${c.id}`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Link>
                </Button>

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
                        <strong>{c.name}</strong>{" "}
                        {t("deleteDescription", { name: c.name })
                          .replace(c.name, "")
                          .trim()}
                      </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                      <AlertDialogCancel>
                        {t("cancel")}
                      </AlertDialogCancel>

                      <AlertDialogAction
                        onClick={() => remove(c.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {t("delete")}
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