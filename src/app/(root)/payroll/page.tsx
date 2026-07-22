import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Wallet2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getServerSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { getPayrollHistory } from "@/actions/payroll-actions";
import { getOrgUsers } from "@/actions/user-actions";
import { PayrollList } from "./_components/payroll-list";
import { DrawerBackdrop } from "@/components/drawer-backdrop";
import { SalaryRateForm } from "../salary/_components/salary-rate-form";
import { PayrollPaymentForm } from "./_components/payroll-payment-form";
import { PAGES } from "@/config/pages.config";

export const dynamic = "force-dynamic";

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ setSalary?: string; pay?: string }>;
}) {
  const session = await getServerSession();
  if (!session || !hasPermission(session.role, "payroll:read")) {
    redirect(PAGES.HOME);
  }
  const canManage = hasPermission(session.role, "payroll:manage");

  const { setSalary, pay } = await searchParams;

  const [payments, users] = await Promise.all([
    getPayrollHistory(),
    getOrgUsers(),
  ]);

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Payroll</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Xodimlar oyligi va stavkalar tarixi
            </p>
          </div>
          {canManage && (
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href={`${PAGES.PAYROLL}?setSalary=1`}>
                  <Wallet2 className="w-4 h-4 mr-1" />
                  Set salary
                </Link>
              </Button>
              <Button asChild>
                <Link href={`${PAGES.PAYROLL}?pay=1`}>
                  <Plus className="w-4 h-4 mr-1" />
                  Pay salary
                </Link>
              </Button>
            </div>
          )}
        </div>

        <PayrollList payments={payments} canManage={canManage} />
      </div>

      <DrawerBackdrop isOpen={setSalary === "1"}>
        <SalaryRateForm users={users} />
      </DrawerBackdrop>

      <DrawerBackdrop isOpen={pay === "1"}>
        <PayrollPaymentForm users={users} />
      </DrawerBackdrop>

    </>
  );
}
