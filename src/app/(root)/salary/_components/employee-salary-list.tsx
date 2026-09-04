"use client";

import Link from "next/link";
import { Users, Wallet2 } from "lucide-react";
import { useTranslations } from "next-intl";

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
import { PAGES } from "@/config/pages.config";
import type { IOrgUser } from "@/types/user.types";

interface Props {
  employees: IOrgUser[];
  canManage: boolean;
}

const fmtDate = (d: Date) =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(d));

export function EmployeeSalaryList({
  employees,
  canManage,
}: Props) {
  const t = useTranslations("salary.list");

  if (employees.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />

        <p className="text-sm">
          {t("noEmployees")}
        </p>
      </div>
    );
  }

  console.log(employees, canManage);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("employee")}</TableHead>
          <TableHead>{t("role")}</TableHead>
          <TableHead>{t("salaryType")}</TableHead>
          <TableHead>{t("rate")}</TableHead>
          <TableHead>{t("effectiveFrom")}</TableHead>

          {canManage && (
            <TableHead className="text-right">
              {t("actions")}
            </TableHead>
          )}
        </TableRow>
      </TableHeader>

      <TableBody>
        {employees.map((e) => (
          <TableRow key={e.id}>
            <TableCell className="font-medium">
              {e.name}
            </TableCell>

            <TableCell>
              <Badge variant="secondary">
                {e.role}
              </Badge>
            </TableCell>

            <TableCell>
              {e.salaryType ? (
                e.salaryType
              ) : (
                <span className="text-muted-foreground text-sm">
                  {t("notSet")}
                </span>
              )}
            </TableCell>

            <TableCell className="text-sm">
              {e.rate !== null
                ? e.rate.toFixed(2) + " сум"
                : "—"}
            </TableCell>

            <TableCell className="text-muted-foreground text-sm">
              {e.effectiveFrom
                ? fmtDate(e.effectiveFrom)
                : "—"}
            </TableCell>

            {canManage && (
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                >
                  <Link
                    href={`${PAGES.SALARY}?setSalary=${e.id}`}
                  >
                    <Wallet2 className="w-3.5 h-3.5 mr-1" />

                    {e.salaryType
                      ? t("update")
                      : t("set")}
                  </Link>
                </Button>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}