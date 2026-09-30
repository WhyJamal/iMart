"use client";

import { useMemo } from "react";

import { ReportExportMenu } from "@/components/report/report-export-menu";
import type { ReportExportConfig } from "@/lib/report-export";
import { useTranslations } from "next-intl";

interface Debtor {
  id: string;
  name: string;
  debt: number;
}

interface Supplier {
  id: string;
  name: string;
  debt: number;
}

interface Props {
  debtors: Debtor[];
  suppliers: Supplier[];
  totalOwedToUs: number;
  totalWeOwe: number;
}

type DebtRow = {
  type: string;
  name: string;
  debt: number;
};

const fmt = (n: number) => n.toLocaleString("uz-UZ") + " so'm";

export function DebtReportExport({
  debtors,
  suppliers,
  totalOwedToUs,
  totalWeOwe,
}: Props) {
  const t = useTranslations("debt-report");
  
  const config = useMemo<ReportExportConfig<DebtRow>>(
    () => ({
      title: t("title"),
      fileName: "debt-report",
      orientation: "portrait",

      rows: [
        ...debtors.map((d) => ({
          type: t("owedToUs.title"),
          name: d.name,
          debt: d.debt,
        })),

        ...suppliers.map((s) => ({
          type: t("weOwe.title"),
          name: s.name,
          debt: s.debt,
        })),
      ],

      columns: [
        {
          header: t("columns.type"),
          value: (r) => r.type,
        },
        {
          header: t("columns.name"),
          value: (r) => r.name,
        },
        {
          header: t("columns.debt"),
          value: (r) => r.debt,
          format: fmt,
          align: "right",
        },
      ],

      footer: [
        t("total"),
        null,
        totalOwedToUs + totalWeOwe,
      ],
    }),
    [t, debtors, suppliers, totalOwedToUs, totalWeOwe],
  );

  return (
    <ReportExportMenu
      config={config}
      disabled={debtors.length === 0 && suppliers.length === 0}
    />
  );
}