"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Users as UsersIcon, Trash2 } from "lucide-react";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

import { ROLES, type Role } from "@/types/role.types";
import type { IOrgUser } from "@/types/user.types";
import type { IPointOption } from "@/types/point.types";

import {
  useUpdateUserRole,
  useUpdateUserPoint,
  useDeleteUser,
  useUpdateUserSchedule,
} from "../_hooks/use-user-mutations";

interface Props {
  users: IOrgUser[];
  points: IPointOption[];
  schedules: {
    id: string;
    name: string;
    year: number;
  }[];
  currentUserId: string;
  currentRole: Role;
}

const fmtDate = (d: Date) =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(d));

const NO_POINT = "__none__";
const NO_SCHEDULE = "**none**";

export function UserList({
  users,
  points,
  schedules,
  currentUserId,
  currentRole,
}: Props) {
  const router = useRouter();
  const t = useTranslations("users.list");

  const { mutate: changeRole, isPending: isChangingRole } =
    useUpdateUserRole(() => router.refresh());

  const { mutate: changePoint, isPending: isChangingPoint } =
    useUpdateUserPoint(() => router.refresh());

  const { mutate: removeUser, isPending: isDeleting } =
    useDeleteUser(() => router.refresh());

  const {
    mutate: changeSchedule,
    isPending: isChangingSchedule,
  } = useUpdateUserSchedule(() => router.refresh());

  if (users.length === 0) {
    return (
      <div className="text-center py-24 text-muted-foreground">
        <UsersIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">{t("empty")}</p>
      </div>
    );
  }

  const assignableRoles = ROLES.filter(
    (r) => r !== "OWNER" || currentRole === "OWNER"
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("name")}</TableHead>
          <TableHead>{t("email")}</TableHead>
          <TableHead>{t("role")}</TableHead>
          <TableHead>{t("point")}</TableHead>
          <TableHead>{t("schedule")}</TableHead>
          <TableHead>{t("joined")}</TableHead>
          <TableHead className="text-right">
            {t("actions")}
          </TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {users.map((u) => {
          const isSelf = u.id === currentUserId;

          return (
            <TableRow key={u.id}>
              <TableCell className="font-medium">
                {u.name}{" "}
                {isSelf && (
                  <Badge variant="secondary" className="ml-1">
                    {t("you")}
                  </Badge>
                )}
              </TableCell>

              <TableCell className="text-muted-foreground text-sm">
                {u.email}
              </TableCell>

              <TableCell>
                <Select
                  value={u.role}
                  disabled={isSelf || isChangingRole}
                  onValueChange={(v) =>
                    changeRole(u.id, v as Role)
                  }
                >
                  <SelectTrigger className="w-35">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {assignableRoles.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>

              <TableCell>
                <Select
                  value={u.pointId ?? NO_POINT}
                  disabled={isChangingPoint}
                  onValueChange={(v) =>
                    changePoint(
                      u.id,
                      v === NO_POINT ? null : v
                    )
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder={t("notAssigned")} />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value={NO_POINT}>
                      {t("notAssigned")}
                    </SelectItem>

                    {points.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>

              <TableCell>
                <Select
                  value={u.workScheduleId ?? NO_SCHEDULE}
                  disabled={isChangingSchedule}
                  onValueChange={(v) =>
                    changeSchedule(
                      u.id,
                      v === NO_SCHEDULE ? null : v
                    )
                  }
                >
                  <SelectTrigger className="w-45">
                    <SelectValue placeholder={t("schedule")} />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value={NO_SCHEDULE}>
                      {t("notScheduled")}
                    </SelectItem>

                    {schedules.map((schedule) => (
                      <SelectItem
                        key={schedule.id}
                        value={schedule.id}
                      >
                        {schedule.name} ({schedule.year})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>

              <TableCell className="text-muted-foreground text-sm">
                {fmtDate(u.createdAt)}
              </TableCell>

              <TableCell className="text-right">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      disabled={isSelf || isDeleting}
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
                          name: u.name,
                          email: u.email,
                        })}
                      </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                      <AlertDialogCancel>
                        {t("cancel")}
                      </AlertDialogCancel>

                      <AlertDialogAction
                        onClick={() => removeUser(u.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {t("delete")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}