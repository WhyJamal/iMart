import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { getServerSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { getPayrollAccruals } from "@/actions/payroll-accrual-actions";
import { getPointOptions } from "@/actions/point-actions";
import { AccrualList } from "./_components/accrual-list";
import { DrawerBackdrop } from "@/components/drawer-backdrop";
import { AccrualForm } from "./_components/accrual-form";
import { PAGES } from "@/config/pages.config";

export const dynamic = "force-dynamic";

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const t = await getTranslations("payroll");

  const session = await getServerSession();

  if (!session || !hasPermission(session.role, "payroll:read")) {
    redirect(PAGES.HOME);
  }

  const canManage = hasPermission(session.role, "payroll:manage");

  const { new: isNew } = await searchParams;

  const [accruals, points] = await Promise.all([
    getPayrollAccruals(),
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

        <AccrualList
          accruals={accruals}
          canManage={canManage}
        />
      </div>

      <DrawerBackdrop isOpen={isNew === "1"}>
        <AccrualForm points={points} />
      </DrawerBackdrop>
    </>
  );
}