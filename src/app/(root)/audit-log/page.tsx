import { getTranslations } from "next-intl/server";
import { History } from "lucide-react";

import { getServerSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { getAuditLogs, getAuditLogUsers } from "@/actions/audit-actions";
import type { AuditAction, AuditEntityType } from "@/types/audit.types";

import { AuditLogFilters } from "./_components/audit-log-filters";
import { AuditLogTable } from "./_components/audit-log-table";

export const dynamic = "force-dynamic";

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{
    user?: string;
    type?: string;
    action?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
}) {
  const { user, type, action, from, to, page } = await searchParams;

  const session = await getServerSession();
  const t = await getTranslations("audit-log");

  if (!session || !hasPermission(session.role, "audit:read")) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground text-sm">
          {t("noAccess")}
        </p>
      </div>
    );
  }

  const pageNum = page ? Math.max(1, parseInt(page, 10) || 1) : 1;

  const [{ items, total, pageSize }, users] = await Promise.all([
    getAuditLogs({
      userId: user || undefined,
      entityType: (type as AuditEntityType) || undefined,
      action: (action as AuditAction) || undefined,
      dateFrom: from || undefined,
      dateTo: to || undefined,
      page: pageNum,
    }),
    getAuditLogUsers(),
  ]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <History className="w-5 h-5 text-primary" />
        </div>

        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>

          <p className="text-muted-foreground text-sm mt-0.5">
            {t("description")}
          </p>
        </div>
      </div>

      <AuditLogFilters users={users} />

      <AuditLogTable
        items={items}
        total={total}
        pageSize={pageSize}
        page={pageNum}
      />
    </div>
  );
}
