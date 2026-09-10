"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const { update } = useSession();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSelect = (organizationId: string) => {
    setPendingId(organizationId);
    startTransition(async () => {
      // jwt callback'dagi `trigger === "update" && session?.organizationId`
      // shoxobchasini ishga tushiradi — o'sha OrganizationMember'dan
      // role/pointId/workScheduleId'ni sessiyaga yozadi.
      await update({ organizationId });
      router.push(PAGES.HOME);
      router.refresh();
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
      <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-6">
        <Building2 className="w-5 h-5 text-blue-500" />
      </div>

      <div className="mb-7">
        <h1 className="text-xl font-semibold tracking-tight text-gray-900">
          {t("title")}
        </h1>
        <p className="text-sm text-gray-500 mt-1">{t("description")}</p>
      </div>

      {organizations.length === 0 ? (
        <p className="text-sm text-gray-500">{t("empty")}</p>
      ) : (
        <div className="space-y-2">
          {organizations.map((org) => (
            <button
              key={org.organizationId}
              type="button"
              disabled={isPending}
              onClick={() => handleSelect(org.organizationId)}
              className="w-full flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 text-left hover:border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-60"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {org.name}
                </p>
                <p className="text-xs text-gray-500">{org.role}</p>
              </div>

              {isPending && pendingId === org.organizationId ? (
                <span className="text-xs text-gray-400">…</span>
              ) : (
                <ArrowRight className="w-4 h-4 text-gray-400" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
