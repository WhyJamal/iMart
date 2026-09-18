"use client";

import { useTranslations } from "next-intl";
import { FileDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { downloadExcel } from "@/lib/excel";
import type { IProduct } from "@/types/product.types";

interface Props {
  products: IProduct[];
}

// Bu eksport bir vaqtning o'zida ikki vazifani bajaradi:
//  1) Foydalanuvchi "qaysi nomenklatura qanday kodda" ekanini ko'radi;
//  2) Ustunlari "Kirim" hujjatining Excel shabloni bilan bir xil
//     (Kod | Nomi | O'lchov birligi | Miqdor | Narx) — shuning uchun
//     shu faylning o'ziga Miqdor ustunini to'ldirib, to'g'ridan-to'g'ri
//     Kirim hujjatiga yuklash mumkin.
export function ExportProductsButton({ products }: Props) {
  const t = useTranslations("product");

  const handleExport = () => {
    const rows = products.map((p) => ({
      [t("export.code")]: p.code,
      [t("export.name")]: p.name,
      [t("export.unit")]: p.unit,
      [t("export.qty")]: "",
      [t("export.price")]: p.price,
    }));

    downloadExcel(
      `mahsulotlar-${new Date().toISOString().slice(0, 10)}.xlsx`,
      t("export.sheetName"),
      rows
    );
  };

  return (
    <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport}>
      <FileDown className="w-4 h-4 text-green-500" />
      {t("export.button")}
    </Button>
  );
}
