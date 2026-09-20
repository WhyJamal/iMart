import { getProfile } from "@/actions/user-actions";
import { getUserTheme } from "@/lib/theme/server";
import ProfileCard from "./_components/profile-card";
import AccountTabs from "./_components/account-tabs";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getProfile();
  const theme = await getUserTheme(user.id);

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Cover — asosiy rangdan (--primary) hosil qilingan gradient */}
      <div
        className="h-56"
        style={{
          background:
            "linear-gradient(to bottom, var(--primary) 0%, var(--primary) 40%, var(--background) 100%)",
        }}
      />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 -mt-28 relative z-10">
        <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6 items-start">
          <ProfileCard user={user} />

          <AccountTabs user={user} initialTheme={theme} />
        </div>
      </div>
    </div>
  );
}