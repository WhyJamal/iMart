"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const { mutate: remove, isPending } = useDeleteTemplate(() => router.refresh());

  if (templates.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <CalendarClock className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No templates yet</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nomi</TableHead>
          <TableHead>Ish kunlari (soat)</TableHead>
          <TableHead>Grafiklar</TableHead>
          {canManage && <TableHead className="text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {templates.map((t) => (
          <TableRow key={t.id}>
            <TableCell className="font-medium">{t.name}</TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {t.days.map((d) => d.workHours).join(" / ")}
            </TableCell>
            <TableCell>
              <Badge variant="secondary">{t.scheduleCount}</Badge>
            </TableCell>
            {canManage && (
              <TableCell className="text-right space-x-1">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`${PAGES.WORK_SCHEDULES}?editTemplate=${t.id}`}>
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
                      <AlertDialogTitle>Shablonni o'chirish?</AlertDialogTitle>
                      <AlertDialogDescription>
                        <strong>{t.name}</strong> o'chiriladi.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => remove(t.id)}
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
        ))}
      </TableBody>
    </Table>
  );
}
