"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FileSpreadsheet, Trash2 } from "lucide-react";

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

import type { ITimesheetSummary } from "@/types/timesheet.types";
import { PAGES } from "@/config/pages.config";
import { useDeleteTimesheet } from "../_hooks/use-timesheet-mutations";

interface Props {
  timesheets: ITimesheetSummary[];
  canManage: boolean;
}

export function TimesheetList({
  timesheets,
  canManage,
}: Props) {
  const t = useTranslations("timesheet.list");
  const months = useTranslations("timesheet.months");

  const router = useRouter();

  const { mutate: remove, isPending } =
    useDeleteTimesheet(() => router.refresh());

  if (timesheets.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <FileSpreadsheet className="w-10 h-10 mx-auto mb-3 opacity-30" />

        <p className="text-sm">{t("empty")}</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("point")}</TableHead>
          <TableHead>{t("period")}</TableHead>
          <TableHead>{t("employees")}</TableHead>
          <TableHead>{t("status")}</TableHead>

          {canManage && (
            <TableHead className="text-right">
              {t("actions")}
            </TableHead>
          )}
        </TableRow>
      </TableHeader>

      <TableBody>
        {timesheets.map((timesheet) => {
          const period = `${months(
            String(timesheet.month - 1)
          )} ${timesheet.year}`;

          return (
            <TableRow
              key={timesheet.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() =>
                router.push(
                  `${PAGES.TIMESHEETS}/${timesheet.id}`
                )
              }
            >
              <TableCell className="font-medium">
                {timesheet.pointName}
              </TableCell>

              <TableCell>{period}</TableCell>

              <TableCell>
                <Badge variant="secondary">
                  {timesheet.userCount}
                </Badge>
              </TableCell>

              <TableCell>
                <Badge
                  variant={
                    timesheet.status === "CONFIRMED"
                      ? "default"
                      : "secondary"
                  }
                >
                  {timesheet.status === "CONFIRMED"
                    ? t("confirmed")
                    : t("draft")}
                </Badge>
              </TableCell>

              {canManage && (
                <TableCell
                  className="text-right"
                  onClick={(e) => e.stopPropagation()}
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
                          {t("deleteDescription", {
                            point: timesheet.pointName,
                            period,
                          })}
                        </AlertDialogDescription>
                      </AlertDialogHeader>

                      <AlertDialogFooter>
                        <AlertDialogCancel>
                          {t("cancel")}
                        </AlertDialogCancel>

                        <AlertDialogAction
                          onClick={() =>
                            remove(timesheet.id)
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
          );
        })}
      </TableBody>
    </Table>
  );
}