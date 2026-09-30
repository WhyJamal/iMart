"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Printer,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  exportToExcel,
  exportToPdf,
  printReport,
  type ReportExportConfig,
} from "@/lib/report-export";

type Kind = "excel" | "pdf" | "print";

interface Props<T> {
  config: ReportExportConfig<T>;
  disabled?: boolean;
}

export function ReportExportMenu<T>({ config, disabled }: Props<T>) {
  const t = useTranslations("common.report");
  const [busy, setBusy] = useState<Kind | null>(null);

  const labels = { generatedAt: t("generatedAt"), page: t("page") };

  const run = async (kind: Kind) => {
    setBusy(kind);
    try {
      if (kind === "excel") await exportToExcel(config);
      else if (kind === "pdf") await exportToPdf(config, labels);
      else printReport(config, labels);
    } catch (err) {
      console.error("[report-export]", err);
      toast.error(t("failed"));
    } finally {
      setBusy(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled || busy !== null}>
          {busy ? (
            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-1.5" />
          )}
          {t("export")}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => run("excel")}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          {t("excel")}
        </DropdownMenuItem>

        <DropdownMenuItem onSelect={() => run("pdf")}>
          <FileText className="w-4 h-4 mr-2" />
          {t("pdf")}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onSelect={() => run("print")}>
          <Printer className="w-4 h-4 mr-2" />
          {t("print")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}