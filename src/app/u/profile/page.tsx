import { getProfile } from "@/actions/user-actions";
import ProfileCard from "./_components/profile-card";
import AccountTabs from "./_components/account-tabs";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getProfile();

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Cover */}
      <div
        className="h-56"
        style={{
          background: 'linear-gradient(to bottom, #b91c1c 0%, #b91c1c 40%, #f5f5f7 100%)',
        }}
      />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 -mt-28 relative z-10">
        <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6 items-start">
          <ProfileCard user={user} />

          <AccountTabs user={user} />
        </div>
      </div>
    </div>
  );
}