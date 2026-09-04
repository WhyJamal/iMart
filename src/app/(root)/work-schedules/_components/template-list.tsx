"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CalendarClock, Pencil, Trash2 } from "lucide-react";

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

import type { IWorkScheduleTemplate } from "@/types/work-schedule.types";

import { PAGES } from "@/config/pages.config";
import { useDeleteTemplate } from "../_hooks/use-work-schedule-mutations";

interface Props {
  templates: IWorkScheduleTemplate[];
  canManage: boolean;
}

export function TemplateList({ templates, canManage }: Props) {
  const t = useTranslations("work-schedules.templateList");

  const router = useRouter();

  const { mutate: remove, isPending } = useDeleteTemplate(() =>
    router.refresh()
  );

  if (templates.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <CalendarClock className="w-8 h-8 mx-auto mb-2 opacity-30" />

        <p className="text-sm">{t("empty")}</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("name")}</TableHead>
          <TableHead>{t("workingDays")}</TableHead>
          <TableHead>{t("schedules")}</TableHead>

          {canManage && (
            <TableHead className="text-right">
              {t("actions")}
            </TableHead>
          )}
        </TableRow>
      </TableHeader>

      <TableBody>
        {templates.map((template) => (
          <TableRow key={template.id}>
            <TableCell className="font-medium">
              {template.name}
            </TableCell>

            <TableCell className="text-sm text-muted-foreground">
              {template.days
                .map((d) => d.workHours)
                .join(" / ")}
            </TableCell>

            <TableCell>
              <Badge variant="secondary">
                {template.scheduleCount}
              </Badge>
            </TableCell>

            {canManage && (
              <TableCell className="text-right space-x-1">
                <Button variant="ghost" size="sm" asChild>
                  <Link
                    href={`${PAGES.WORK_SCHEDULES}?editTemplate=${template.id}`}
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
                          name: template.name,
                        })}
                      </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                      <AlertDialogCancel>
                        {t("cancel")}
                      </AlertDialogCancel>

                      <AlertDialogAction
                        onClick={() => remove(template.id)}
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