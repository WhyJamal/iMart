"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarRange, Trash2 } from "lucide-react";
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
import type { IWorkScheduleSummary } from "@/types/work-schedule.types";
import { PAGES } from "@/config/pages.config";
import { useDeleteWorkSchedule } from "../_hooks/use-work-schedule-mutations";

interface Props {
  schedules: IWorkScheduleSummary[];
  canManage: boolean;
}

export function ScheduleList({ schedules, canManage }: Props) {
  const router = useRouter();
  const { mutate: remove, isPending } = useDeleteWorkSchedule(() => router.refresh());

  if (schedules.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <CalendarRange className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No schedules yet</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nomi</TableHead>
          <TableHead>Yil</TableHead>
          <TableHead>Shablon</TableHead>
          <TableHead>Xodimlar</TableHead>
          <TableHead>To'ldirilgan kunlar</TableHead>
          {canManage && <TableHead className="text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {schedules.map((s) => (
          <TableRow
            key={s.id}
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => router.push(`${PAGES.WORK_SCHEDULES}/${s.id}`)}
          >
            <TableCell className="font-medium">{s.name}</TableCell>
            <TableCell>{s.year}</TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {s.templateName}
            </TableCell>
            <TableCell>
              <Badge variant="secondary">{s.userCount}</Badge>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {s.filledDaysCount} / {s.year % 4 === 0 ? 366 : 365}
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
                      <AlertDialogTitle>Grafikni o'chirish?</AlertDialogTitle>
                      <AlertDialogDescription>
                        <strong>{s.name}</strong> va uning barcha kunlik
                        yozuvlari o'chiriladi.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => remove(s.id)}
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
