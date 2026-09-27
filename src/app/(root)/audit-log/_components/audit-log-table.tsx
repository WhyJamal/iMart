"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { History, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

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

import type { IAuditLog } from "@/types/audit.types";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const actionVariant: Record<IAuditLog["action"], "default" | "secondary" | "destructive"> = {
  CREATE: "secondary",
  UPDATE: "default",
  DELETE: "destructive",
};

interface Props {
  items: IAuditLog[];
  total: number;
  pageSize: number;
  page: number;
}

export function AuditLogTable({ items, total, pageSize, page }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const t = useTranslations("audit-log");

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const goToPage = (p: number) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("page", String(p));
    router.push(`/audit-log?${next.toString()}`);
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-24 text-muted-foreground">
        <History className="w-10 h-10 mx-auto mb-3 opacity-30" />

        <p className="text-sm">{t("empty")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("table.date")}</TableHead>
            <TableHead>{t("table.user")}</TableHead>
            <TableHead>{t("table.action")}</TableHead>
            <TableHead>{t("table.entityType")}</TableHead>
            <TableHead>{t("table.summary")}</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {items.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                {fmtDate(log.createdAt)}
              </TableCell>

              <TableCell className="text-sm">
                {log.userName ?? t("system")}
              </TableCell>

              <TableCell>
                <Badge variant={actionVariant[log.action]}>
                  {t(`actions.${log.action}`)}
                </Badge>
              </TableCell>

              <TableCell className="text-sm">
                {t(`entityTypes.${log.entityType}`)}
              </TableCell>

              <TableCell className="text-sm text-muted-foreground">
                {log.summary}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-muted-foreground">
            {t("pagination.pageInfo", { page, total })}
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => goToPage(page - 1)}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              {t("pagination.prev")}
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => goToPage(page + 1)}
            >
              {t("pagination.next")}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
