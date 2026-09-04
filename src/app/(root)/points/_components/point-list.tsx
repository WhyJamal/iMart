"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, Pencil, Trash2 } from "lucide-react";
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
import type { IPoint } from "@/types/point.types";
import { PAGES } from "@/config/pages.config";
import { useDeletePoint } from "../_hooks/use-point-mutations";

import { useTranslations } from "next-intl";

interface Props {
  points: IPoint[];
  canManage: boolean;
}

export function PointList({
  points,
  canManage,
}: Props) {
  const router = useRouter();

  const t = useTranslations("point.list");

  const {
    mutate: remove,
    isPending,
  } = useDeletePoint(() =>
    router.refresh()
  );

  if (points.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <MapPin className="w-10 h-10 mx-auto mb-3 opacity-30" />

        <p className="text-sm">
          {t("empty")}
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            {t("name")}
          </TableHead>

          <TableHead>
            {t("warehouses")}
          </TableHead>

          <TableHead>
            {t("employees")}
          </TableHead>

          {canManage && (
            <TableHead className="text-right">
              {t("actions")}
            </TableHead>
          )}
        </TableRow>
      </TableHeader>

      <TableBody>
        {points.map((p) => (
          <TableRow key={p.id}>
            <TableCell className="font-medium">
              {p.name}
            </TableCell>

            <TableCell>
              <Badge variant="secondary">
                {p.warehouseCount}
              </Badge>
            </TableCell>

            <TableCell>
              <Badge variant="secondary">
                {p.userCount}
              </Badge>
            </TableCell>

            {canManage && (
              <TableCell className="text-right space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                >
                  <Link
                    href={`${PAGES.POINTS}?edit=${p.id}`}
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
                        {t("deleteDescription", {
                          name: p.name,
                        })}
                      </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                      <AlertDialogCancel>
                        {t("cancel")}
                      </AlertDialogCancel>

                      <AlertDialogAction
                        onClick={() =>
                          remove(p.id)
                        }
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