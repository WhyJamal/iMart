import Link from "next/link";

import { Plus, Wallet, Landmark } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  getCashRegister,
  getBankAccount,
  getCashFlows,
} from "@/actions/cash-actions";

import { CashFlowList } from "./_components/cash-flow-list";
import { CashFlowForm } from "./_components/cash-flow-form";
import { DrawerBackdrop } from "@/components/drawer-backdrop";

import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

const fmt = (n: number) => n.toLocaleString("uz-UZ") + " so'm";

export default async function CashPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const { new: isNew } = await searchParams;

  const t = await getTranslations("cash");

  const [register, bank, flows] = await Promise.all([
    getCashRegister(),
    getBankAccount(),
    getCashFlows(),
  ]);

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

          <Button asChild>
            <Link href="/cash?new=1">
              <Plus className="w-4 h-4 mr-1" />
              {t("newMovement")}
            </Link>
          </Button>
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

        <CashFlowList flows={flows} />
      </div>

      <DrawerBackdrop isOpen={isNew === "1"}>
        <CashFlowForm />
      </DrawerBackdrop>
    </>
  );
}