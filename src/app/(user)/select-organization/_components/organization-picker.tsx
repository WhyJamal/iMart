"use client";

import { useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Building2, ArrowRight } from "lucide-react";
import { PAGES } from "@/config/pages.config";
import type { SelectableOrganization } from "../_actions/server";

export function OrganizationPicker({
  organizations,
}: {
  organizations: SelectableOrganization[];
}) {
  const t = useTranslations("select-organization");
  const { update } = useSession();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSelect = (organizationId: string) => {
    setPendingId(organizationId);
    startTransition(async () => {
      await update({ organizationId });

      window.location.href = PAGES.HOME;
    });
  };

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-8">
      <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950 border border-blue-100 dark:border-blue-900 flex items-center justify-center mb-6">
        <Building2 className="w-5 h-5 text-blue-500 dark:text-blue-400" />
      </div>

      <div className="mb-7">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t("description")}</p>
      </div>

      {organizations.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="space-y-2">
          {organizations.map((org) => (
            <button
              key={org.organizationId}
              type="button"
              disabled={isPending}
              onClick={() => handleSelect(org.organizationId)}
              className="w-full flex items-center justify-between rounded-xl border border-border px-4 py-3 text-left hover:border-input hover:bg-muted/40 transition-colors disabled:opacity-60"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {org.name}
                </p>
                <p className="text-xs text-muted-foreground">{org.role}</p>
              </div>

              {isPending && pendingId === org.organizationId ? (
                <span className="text-xs text-muted-foreground">…</span>
              ) : (
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
