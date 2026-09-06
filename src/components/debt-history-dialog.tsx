"use client";

import { useState, useTransition } from "react";
import {
  History,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import type { IDebtLedgerEntry } from "@/types/debtor.types";

interface Props {
  name: string;
  fetchLedger: () => Promise<IDebtLedgerEntry[]>;
  labels: {
    trigger: string;
    title: string;
    empty: string;
    debt: string;
    payment: string;
    balance: string;
  };
}

const fmt = (n: number) => n.toLocaleString("uz-UZ") + " so'm";

const fmtDate = (d: Date) =>
  new Date(d).toLocaleDateString("uz-UZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

function LoadingRows() {
  return (
    <div className="space-y-3 py-1">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3 animate-pulse">
          <div className="w-8 h-8 rounded-full bg-gray-100 shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-2/5 rounded bg-gray-100" />
            <div className="h-2.5 w-1/4 rounded bg-gray-100" />
          </div>
          <div className="h-3 w-16 rounded bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

export function DebtHistoryDialog({ name, fetchLedger, labels }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [entries, setEntries] = useState<IDebtLedgerEntry[] | null>(null);

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (v && entries === null) {
      startTransition(async () => {
        const data = await fetchLedger();
        setEntries(data);
      });
    }
  };

  const currentBalance = entries?.length
    ? entries[entries.length - 1].balance
    : 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
          <History className="w-3.5 h-3.5" />
          {labels.trigger}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-4 space-y-3 border-b bg-linear-to-b from-gray-50/80 to-transparent">
          <DialogTitle className="text-base font-semibold text-gray-900">
            {name}
          </DialogTitle>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-white border shadow-sm flex items-center justify-center shrink-0">
              <Wallet className="w-4 h-4 text-gray-400" />
            </div>
            <div className="leading-tight">
              <p className="text-[11px] text-muted-foreground">
                {labels.balance}
              </p>
              <p
                className={`text-xl font-bold tabular-nums ${
                  currentBalance > 0 ? "text-amber-600" : "text-gray-900"
                }`}
              >
                {fmt(currentBalance)}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="px-5 py-4 max-h-96 overflow-y-auto">
          {isPending || entries === null ? (
            <LoadingRows />
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                <History className="w-4.5 h-4.5 text-gray-300" />
              </div>
              <p className="text-sm text-muted-foreground">{labels.empty}</p>
            </div>
          ) : (
            <ol className="relative">
              {entries.map((e, idx) => {
                const isDebt = e.type === "debt";
                const isLast = idx === entries.length - 1;

                return (
                  <li key={e.id} className="relative flex gap-3 pb-5 last:pb-0">
                    {!isLast && (
                      <span className="absolute left-3.75 top-8 bottom-0 w-px bg-gray-100" />
                    )}

                    <span
                      className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        isDebt
                          ? "bg-amber-50 text-amber-600"
                          : "bg-emerald-50 text-emerald-600"
                      }`}
                    >
                      {isDebt ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownLeft className="w-4 h-4" />
                      )}
                    </span>

                    <div className="flex-1 flex items-start justify-between gap-3 pt-0.5">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {e.label}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {fmtDate(e.date)}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p
                          className={`text-sm font-semibold tabular-nums ${
                            isDebt ? "text-amber-600" : "text-emerald-600"
                          }`}
                        >
                          {isDebt ? "+" : "−"}
                          {fmt(e.amount)}
                        </p>
                        <p className="text-[11px] text-muted-foreground tabular-nums mt-0.5">
                          {fmt(e.balance)}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}