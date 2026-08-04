import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getServerSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { getContragents } from "@/actions/contragent-actions";
import { ContragentList } from "./_components/contragent-list";
import { DrawerBackdrop } from "@/components/drawer-backdrop";
import { ContragentForm } from "./_components/contragent-form";
import { PAGES } from "@/config/pages.config";

export const dynamic = "force-dynamic";

export default async function ContragentsPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string; edit?: string }>;
}) {
  const session = await getServerSession();
  if (!session || !hasPermission(session.role, "contragents:manage")) {
    redirect(PAGES.HOME);
  }

  const { new: isNew, edit } = await searchParams;
  const contragents = await getContragents();
  const editTarget = edit ? contragents.find((c) => c.id === edit) : undefined;

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Contragents</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Sotuvchilar va xaridorlar
            </p>
          </div>
          <Button asChild>
            <Link href={`${PAGES.CONTRAGENTS}?new=1`}>
              <Plus className="w-4 h-4 mr-1" />
              New contragent
            </Link>
          </Button>
        </div>

        <ContragentList contragents={contragents} canManage />
      </div>

      <DrawerBackdrop isOpen={isNew === "1"}>
        <ContragentForm />
      </DrawerBackdrop>

      <DrawerBackdrop isOpen={!!edit}>
        {editTarget && <ContragentForm contragent={editTarget} />}
      </DrawerBackdrop>
    </>
  );
}
