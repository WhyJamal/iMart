"use client";

import { useRouter } from "next/navigation";
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

const MONTH_LABELS = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
];

interface Props {
  timesheets: ITimesheetSummary[];
  canManage: boolean;
}

export function TimesheetList({ timesheets, canManage }: Props) {
  const router = useRouter();
  const { mutate: remove, isPending } = useDeleteTimesheet(() => router.refresh());

  if (timesheets.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <FileSpreadsheet className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No timesheets yet</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Point</TableHead>
          <TableHead>Davr</TableHead>
          <TableHead>Xodimlar</TableHead>
          <TableHead>Holat</TableHead>
          {canManage && <TableHead className="text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {timesheets.map((t) => (
          <TableRow
            key={t.id}
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => router.push(`${PAGES.TIMESHEETS}/${t.id}`)}
          >
            <TableCell className="font-medium">{t.pointName}</TableCell>
            <TableCell>
              {MONTH_LABELS[t.month - 1]} {t.year}
            </TableCell>
            <TableCell>
              <Badge variant="secondary">{t.userCount}</Badge>
            </TableCell>
            <TableCell>
              <Badge variant={t.status === "CONFIRMED" ? "default" : "secondary"}>
                {t.status === "CONFIRMED" ? "Tasdiqlangan" : "Qoralama"}
              </Badge>
            </TableCell>
            {canManage && (
              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
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
                      <AlertDialogTitle>Tabelni o'chirish?</AlertDialogTitle>
                      <AlertDialogDescription>
                        <strong>
                          {t.pointName} — {MONTH_LABELS[t.month - 1]} {t.year}
                        </strong>{" "}
                        o'chiriladi.
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