"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Printer, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { getSaleReceiptData } from "@/actions/receipt-actions";
import type { IReceiptData } from "@/types/receipt.types";
import { Receipt } from "./receipt";

interface Props {
  saleId: string | null;
  open: boolean;
  onClose: () => void;
}

export function ReceiptModal({ saleId, open, onClose }: Props) {
  const t = useTranslations("receipt");
  const [data, setData] = useState<IReceiptData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !saleId) return;

    setLoading(true);
    setData(null);

    getSaleReceiptData(saleId).then((result) => {
      setLoading(false);
      if (result.success) setData(result.data);
    });
  }, [open, saleId]);

  const handlePrint = () => window.print();

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-fit p-0 overflow-hidden">
        {/* Faqat chek qismini pechat qilish uchun — modalning
            o'zi/backdrop/tugmalar pechatda ko'rinmaydi. */}
        <style>{`
          @media print {
            body * { visibility: hidden; }
            #receipt-print-area, #receipt-print-area * { visibility: visible; }
            #receipt-print-area { position: fixed; top: 0; left: 50%; transform: translateX(-50%); }
          }
        `}</style>

        <DialogHeader className="px-4 pt-4">
          <DialogTitle className="text-sm">{t("title")}</DialogTitle>
        </DialogHeader>

        <div className="px-4 pb-4 max-h-[70vh] overflow-y-auto">
          {loading || !data ? (
            <div className="w-[300px] h-64 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Receipt data={data} />
          )}
        </div>

        <div className="border-t px-4 py-3 flex justify-end">
          <Button
            size="sm"
            onClick={handlePrint}
            disabled={loading || !data}
            className="gap-1.5"
          >
            <Printer className="w-4 h-4" />
            {t("print")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
