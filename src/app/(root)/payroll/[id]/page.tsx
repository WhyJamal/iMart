import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getServerSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { getPayrollAccrualDetail } from "@/actions/payroll-accrual-actions";
import { AccrualTable } from "./_components/accrual-table";
import { PAGES } from "@/config/pages.config";

export const dynamic = "force-dynamic";

const MONTH_LABELS = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
];

export default async function PayrollAccrualDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession();

  if (!session || !hasPermission(session.role, "payroll:read")) {
    redirect(PAGES.HOME);
  }

  const canManage = hasPermission(session.role, "payroll:manage");

  const { id } = await params;
  const accrual = await getPayrollAccrualDetail(id);

  if (!accrual) notFound();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={PAGES.PAYROLL}
          className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>

        <div>
          <h1 className="text-2xl font-bold">{accrual.pointName}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {MONTH_LABELS[accrual.month - 1]} {accrual.year}
          </p>
        </div>

        <Badge
          variant={
            accrual.status === "CONFIRMED" ? "default" : "secondary"
          }
        >
          {accrual.status === "CONFIRMED" ? "Tasdiqlangan" : "Qoralama"}
        </Badge>
      </div>

      <AccrualTable accrual={accrual} canManage={canManage} />
    </div>
  );
}