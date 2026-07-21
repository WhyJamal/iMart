"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile, changePassword } from "@/actions/user-actions";
import { Button } from "@/components/ui/button";

interface Props {
  user: {
    id: string;
    name: string;
    email: string;
    organization: { id: string; name: string; logo: string | null } | null;
  };
}

const TABS = [
  { id: "account", label: "Hisob ma'lumotlari" },
  { id: "security", label: "Xavfsizlik" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function splitName(name: string) {
  const [first, ...rest] = name.trim().split(/\s+/);
  return { firstName: first ?? "", lastName: rest.join(" ") };
}

function AccountForm({ user }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { firstName: initialFirst, lastName: initialLast } = splitName(user.name);

  const [firstName, setFirstName] = useState(initialFirst);
  const [lastName, setLastName] = useState(initialLast);
  const [email, setEmail] = useState(user.email);

  const handleSubmit = () => {
    const name = `${firstName} ${lastName}`.trim();
    if (!name) {
      toast.error("Ismni kiriting");
      return;
    }

    startTransition(async () => {
      const result = await updateProfile({ name, email });
      if (result.success) {
        toast.success("Ma'lumotlar yangilandi");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="pt-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-5">
        <div className="space-y-1.5">
          <Label className="text-[13px] font-medium text-[#6e6e73]">Ism</Label>
          <Input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={isPending}
            className="h-10 rounded-lg border-[#d2d2d7] text-[15px] focus-visible:ring-[#0071e3]/25 focus-visible:border-[#0071e3]"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[13px] font-medium text-[#6e6e73]">Familiya</Label>
          <Input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            disabled={isPending}
            className="h-10 rounded-lg border-[#d2d2d7] text-[15px] focus-visible:ring-[#0071e3]/25 focus-visible:border-[#0071e3]"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[13px] font-medium text-[#6e6e73]">Email</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isPending}
            className="h-10 rounded-lg border-[#d2d2d7] text-[15px] focus-visible:ring-[#0071e3]/25 focus-visible:border-[#0071e3]"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[13px] font-medium text-[#6e6e73]">Tashkilot</Label>
          <Input
            value={user.organization?.name ?? "Biriktirilmagan"}
            disabled
            className="h-10 rounded-lg border-[#d2d2d7] text-[15px] bg-[#f5f5f7] text-[#86868b] disabled:opacity-100"
          />
        </div>
      </div>

      <p className="mt-3 text-[12px] text-[#86868b]">
        Tashkilotni o'zgartirish uchun administratorga murojaat qiling.
      </p>

      <Button
        onClick={handleSubmit}
        disabled={isPending}
        className="mt-6"
      >
        {isPending ? "Yangilanmoqda…" : "Yangilash"}
      </Button>
    </div>
  );
}

function SecurityForm() {
  const [isPending, startTransition] = useTransition();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = () => {
    if (!currentPassword || !newPassword) {
      toast.error("Barcha maydonlarni to'ldiring");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Yangi parollar mos kelmadi");
      return;
    }

    startTransition(async () => {
      const result = await changePassword({ currentPassword, newPassword });
      if (result.success) {
        toast.success("Parol yangilandi");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="pt-6">
      <div className="grid grid-cols-1 gap-y-5 max-w-md">
        <div className="space-y-1.5">
          <Label className="text-[13px] font-medium text-[#6e6e73]">Joriy parol</Label>
          <Input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={isPending}
            className="h-10 rounded-lg border-[#d2d2d7] text-[15px] focus-visible:ring-[#0071e3]/25 focus-visible:border-[#0071e3]"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-[#6e6e73]">Yangi parol</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isPending}
              className="h-10 rounded-lg border-[#d2d2d7] text-[15px] focus-visible:ring-[#0071e3]/25 focus-visible:border-[#0071e3]"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-[#6e6e73]">Tasdiqlash</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isPending}
              className="h-10 rounded-lg border-[#d2d2d7] text-[15px] focus-visible:ring-[#0071e3]/25 focus-visible:border-[#0071e3]"
            />
          </div>
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={isPending}
        className="mt-6"
      >
        {isPending ? "Yangilanmoqda…" : "Yangilash"}
      </Button>
    </div>
  );
}

export default function AccountTabs({ user }: Props) {
  const [tab, setTab] = useState<TabId>("account");

  return (
    <div className="rounded-[18px] border border-[#d2d2d7] bg-white px-7 py-6">
      <div className="flex items-center gap-6 border-b border-[#d2d2d7]">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={
              "pb-3 text-[15px] font-medium border-b-2 -mb-px transition-colors " +
              (tab === t.id
                ? "text-[#1d1d1f] border-[#e30013]"
                : "text-[#86868b] border-transparent hover:text-[#1d1d1f]")
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "account" ? <AccountForm user={user} /> : <SecurityForm />}
    </div>
  );
}