"use client";

import { useTranslations } from "next-intl";
import { FileDown } from "lucide-react";

import { downloadExcel } from "@/lib/excel";

interface ProductOption {
  name: string;
  code: string;
  unit: string;
  price: number;
}

const SAMPLE_ROWS = [
  { code: "00123", name: "Coca-Cola 1.5L", qty: "10", price: "18 000" },
  { code: "00456", name: "Non", qty: "50", price: "3 000" },
];

// TemplatePreview — modal ichida ko'rsatiladigan kichik, chiroyli
// jadval namunasi + "Shablon yuklab olish" havolasi. Ustunlari va
// tarjima kalitlari Products sahifasidagi eksport bilan (product.export.*)
// AYNAN bir xil — shablon va yuklash doim mos kelishini kafolatlaydi.
export function TemplatePreview({ products }: { products: ProductOption[] }) {
  const t = useTranslations("product.export");
  const tForm = useTranslations("stock-intake.form");

  const handleDownload = () => {
    const rows = products.map((p) => ({
      [t("code")]: p.code,
      [t("name")]: p.name,
      [t("unit")]: p.unit,
      [t("qty")]: "",
      [t("price")]: p.price,
    }));

    downloadExcel(
      `kirim-shabloni-${new Date().toISOString().slice(0, 10)}.xlsx`,
      t("sheetName"),
      rows
    );
  };

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-muted text-muted-foreground">
              <th className="px-2.5 py-1.5 text-left font-medium">{t("code")}</th>
              <th className="px-2.5 py-1.5 text-left font-medium">{t("name")}</th>
              <th className="px-2.5 py-1.5 text-left font-medium">{t("qty")}</th>
              <th className="px-2.5 py-1.5 text-left font-medium">{t("price")}</th>
            </tr>
          </thead>
          <tbody>
            {SAMPLE_ROWS.map((row, i) => (
              <tr key={i} className="border-t border-border">
                <td className="px-2.5 py-1.5 text-muted-foreground">{row.code}</td>
                <td className="px-2.5 py-1.5">{row.name}</td>
                <td className="px-2.5 py-1.5 font-medium">{row.qty}</td>
                <td className="px-2.5 py-1.5 text-muted-foreground">{row.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={handleDownload}
        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-primary bg-primary/5 hover:bg-primary/10 border-t border-border transition-colors"
      >
        <FileDown className="w-3.5 h-3.5" />
        {tForm("downloadTemplate")}
      </button>
    </div>
  );
}
