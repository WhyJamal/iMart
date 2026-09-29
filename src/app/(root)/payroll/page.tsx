import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { getServerSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import {
  getPayrollAccruals,
  getPayrollAccrualFilterOptions,
} from "@/actions/payroll-accrual-actions";
import { getPointOptions } from "@/actions/point-actions";
import { AccrualList } from "./_components/accrual-list";
import { AccrualFilters } from "./_components/accrual-filters";
import { DrawerBackdrop } from "@/components/drawer-backdrop";
import { ListPagination } from "@/components/list/list-pagination";
import { AccrualForm } from "./_components/accrual-form";
import { PAGES } from "@/config/pages.config";

export const dynamic = "force-dynamic";

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<{
    new?: string;
    page?: string;
    pointId?: string;
    status?: string;
    createdBy?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}) {
  const t = await getTranslations("payroll");

  const session = await getServerSession();

  if (!session || !hasPermission(session.role, "payroll:read")) {
    redirect(PAGES.HOME);
  }

  const canManage = hasPermission(session.role, "payroll:manage");

  const {
    new: isNew,
    page,
    pointId,
    status,
    createdBy,
    dateFrom,
    dateTo,
  } = await searchParams;

  const [accrualsResult, filterOptions, points] = await Promise.all([
    getPayrollAccruals({
      page: page ? Number(page) : undefined,
      pointId: pointId || undefined,
      status: status || undefined,
      createdBy: createdBy || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
    getPayrollAccrualFilterOptions(),
    getPointOptions(),
  ]);

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {t("title")}
            </h1>

            <p className="text-muted-foreground text-sm mt-0.5">
              {t("description")}
            </p>
          </div>

          {canManage && (
            <Button
              asChild
              disabled={points.length === 0}
            >
              <Link href={`${PAGES.PAYROLL}?new=1`}>
                <Plus className="w-4 h-4 mr-1" />
                {t("newDocument")}
              </Link>
            </Button>
          )}
        </div>

        <AccrualFilters
          points={points.map((p) => ({ id: p.id, name: p.name }))}
          creators={filterOptions.creators}
        />

        <AccrualList
          accruals={accrualsResult.items}
          canManage={canManage}
        />

        <ListPagination
          page={accrualsResult.page}
          totalPages={accrualsResult.totalPages}
        />
      </div>

      <DrawerBackdrop isOpen={isNew === "1"}>
        <AccrualForm points={points} />
      </DrawerBackdrop>
    </>
  );
}