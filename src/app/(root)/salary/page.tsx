import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { EmployeeSalaryList } from "./_components/employee-salary-list";
import { DrawerBackdrop } from "@/components/drawer-backdrop";
import { PAGES } from "@/config/pages.config";
import { SalaryRateForm } from "./_components/salary-rate-form";
import { getEmployeeSalaries } from "@/actions/salary-actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Wallet2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SalaryPage({
  searchParams,
}: {
  searchParams: Promise<{ setSalary?: string }>;
}) {
  const session = await getServerSession();
  if (!session || !hasPermission(session.role, "payroll:read")) {
    redirect(PAGES.HOME);
  }
  const canManage = hasPermission(session.role, "payroll:manage");

  const { setSalary } = await searchParams;
  const setSalaryUserId = setSalary && setSalary !== "1" ? setSalary : undefined;

  const employees = await getEmployeeSalaries();

  return (
    <>
      <div className="p-6 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Salary</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Xodimlar stavkasi — bitta joyda
            </p>
          </div>

          <div className="flex gap-2">
            <Button asChild>
              <Link href={`${PAGES.SALARY}?setSalary=1`}>
                <Wallet2 className="w-4 h-4 mr-1" />
                Set salary
              </Link>
            </Button>
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Employees
          </h2>
          <div className="rounded-xl border bg-white overflow-hidden">
            <EmployeeSalaryList employees={employees} canManage={canManage} />
          </div>
        </section>
      </div>

      <DrawerBackdrop isOpen={!!setSalary}>
        <SalaryRateForm users={employees} />
      </DrawerBackdrop>
    </>
  );
}