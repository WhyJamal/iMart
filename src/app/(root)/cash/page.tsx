import Link from "next/link";

import { Plus, Wallet, Landmark } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  getCashRegister,
  getBankAccount,
  getCashFlows,
  getCashPointSummary,
} from "@/actions/cash-actions";
import { getPointOptions } from "@/actions/point-actions";
import { getServerSession } from "@/lib/auth";

import { CashFlowList } from "./_components/cash-flow-list";
import { CashFlowForm } from "./_components/cash-flow-form";
import { CashFilters } from "./_components/cash-filters";
import { CashPointSummary } from "./_components/cash-point-summary";
import { CashTransferDialog } from "./_components/cash-transfer-dialog";
import { DrawerBackdrop } from "@/components/drawer-backdrop";

import type { ICashFilter } from "@/types/cash.types";

import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

const fmt = (n: number) => n.toLocaleString("uz-UZ") + " so'm";

export default async function CashPage({
  searchParams,
}: {
  searchParams: Promise<{
    new?: string;
    point?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const { new: isNew, point, from, to } = await searchParams;

  const t = await getTranslations("cash");

  const session = await getServerSession();

  const filter: ICashFilter = {
    pointId: point || undefined,
    dateFrom: from || undefined,
    dateTo: to || undefined,
  };

  const [register, bank, flows, summary, points] = await Promise.all([
    getCashRegister(),
    getBankAccount(),
    getCashFlows(filter),
    getCashPointSummary(filter),
    getPointOptions(),
  ]);

  // Yangi harakat drawer'ini ochganda ham, yopganda ham joriy filtr
  // saqlanib qolishi uchun havolalar shu yerda yig'iladi.
  const filterParams = new URLSearchParams();
  if (point) filterParams.set("point", point);
  if (from) filterParams.set("from", from);
  if (to) filterParams.set("to", to);

  const closeHref = filterParams.toString()
    ? `/cash?${filterParams.toString()}`
    : "/cash";

  filterParams.set("new", "1");
  const newHref = `/cash?${filterParams.toString()}`;

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {t("title")}
            </h1>

            <p className="text-muted-foreground text-sm mt-0.5">
              {t("description")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <CashTransferDialog
              points={points}
              defaultPointId={session?.pointId ?? null}
            />

            <Button asChild>
              <Link href={newHref}>
                <Plus className="w-4 h-4 mr-1" />
                {t("newMovement")}
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border bg-card p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Wallet className="w-6 h-6 text-primary" />
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                {t("cash")}
              </p>

              <p className="text-3xl font-bold tabular-nums">
                {fmt(register.balance)}
              </p>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
              <Landmark className="w-6 h-6 text-blue-600" />
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                {t("bank")}
              </p>

              <p className="text-3xl font-bold tabular-nums">
                {fmt(bank.balance)}
              </p>
            </div>
          </div>
        </div>

        <CashFilters points={points} />

        <CashPointSummary rows={summary} />

        <CashFlowList flows={flows} />
      </div>

      <DrawerBackdrop isOpen={isNew === "1"}>
        <CashFlowForm
          points={points}
          defaultPointId={session?.pointId ?? null}
          closeHref={closeHref}
        />
      </DrawerBackdrop>
    </>
  );
}