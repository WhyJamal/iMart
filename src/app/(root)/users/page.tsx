import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getServerSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { getOrgUsers } from "@/actions/user-actions";
import { UserList } from "./_components/user-list";
import { DrawerBackdrop } from "@/components/drawer-backdrop";
import { UserForm } from "./_components/user-form";
import { PAGES } from "@/config/pages.config";

export const dynamic = "force-dynamic";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const session = await getServerSession();
  if (!session || !hasPermission(session.role, "users:manage")) {
    redirect(PAGES.HOME);
  }

  const { new: isNew } = await searchParams;
  const users = await getOrgUsers();

  return (
    <div className="p-6 space-y-6">
      {isNew && (
        <DrawerBackdrop>
          <UserForm />
        </DrawerBackdrop>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Xodimlar va ularning rollarini boshqarish
          </p>
        </div>
        <Button asChild>
          <Link href={`${PAGES.USERS}?new=1`}>
            <Plus className="w-4 h-4 mr-1" />
            New user
          </Link>
        </Button>
      </div>

      <UserList users={users} currentUserId={session.userId} currentRole={session.role} />
    </div>
  );
}
