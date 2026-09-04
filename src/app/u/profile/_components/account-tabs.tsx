"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  updateProfile,
  changePassword,
  updateLocale,
} from "@/actions/user-actions";
import { Button } from "@/components/ui/button";
import {
  LOCALE_KEYS,
  LOCALES,
  type TLocale,
} from "@/config/locales.config";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  user: {
    id: string;
    name: string;
    email: string;
    locale: TLocale;
    organization: {
      id: string;
      name: string;
      logo: string | null;
    } | null;
  };
}

const TABS = [
  { id: "account", label: "account" },
  { id: "security", label: "security" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function splitName(name: string) {
  const [first, ...rest] = name.trim().split(/\s+/);

  return {
    firstName: first ?? "",
    lastName: rest.join(" "),
  };
}

function AccountForm({ user }: Props) {
  const t = useTranslations("profile");
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  const { firstName: initialFirst, lastName: initialLast } =
    splitName(user.name);

  const [firstName, setFirstName] = useState(initialFirst);
  const [lastName, setLastName] = useState(initialLast);
  const [email, setEmail] = useState(user.email);

  const { update: updateSession } = useSession();

  const handleLocaleChange = (locale: TLocale) => {
    if (locale === user.locale) return;

    startTransition(async () => {
      const result = await updateLocale(locale);

      if (result.success) {
        await updateSession({ locale });

        toast.success(t("messages.languageUpdated"));
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleSubmit = () => {
    const name = `${firstName} ${lastName}`.trim();

    if (!name) {
      toast.error(t("messages.nameRequired"));
      return;
    }

    startTransition(async () => {
      const result = await updateProfile({ name, email });

      if (result.success) {
        toast.success(t("messages.profileUpdated"));
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
          <Label className="text-[13px] font-medium text-[#6e6e73]">
            {t("fields.firstName")}
          </Label>

          <Input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={isPending}
            className="h-10 rounded-lg border-[#d2d2d7] text-[15px] focus-visible:ring-[#0071e3]/25 focus-visible:border-[#0071e3]"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[13px] font-medium text-[#6e6e73]">
            {t("fields.lastName")}
          </Label>

          <Input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            disabled={isPending}
            className="h-10 rounded-lg border-[#d2d2d7] text-[15px] focus-visible:ring-[#0071e3]/25 focus-visible:border-[#0071e3]"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[13px] font-medium text-[#6e6e73]">
            {t("fields.email")}
          </Label>

          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isPending}
            className="h-10 rounded-lg border-[#d2d2d7] text-[15px] focus-visible:ring-[#0071e3]/25 focus-visible:border-[#0071e3]"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[13px] font-medium text-[#6e6e73]">
            {t("fields.language")}
          </Label>

          <Select
            value={user.locale}
            onValueChange={(value) =>
              handleLocaleChange(value as TLocale)
            }
            disabled={isPending}
          >
            <SelectTrigger className="h-10 rounded-lg border-[#d2d2d7] text-[15px] focus:ring-[#0071e3]/25">
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              {LOCALE_KEYS.map((locale) => (
                <SelectItem key={locale} value={locale}>
                  {LOCALES[locale].nativeName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[13px] font-medium text-[#6e6e73]">
            {t("fields.organization")}
          </Label>

          <Input
            value={
              user.organization?.name ??
              t("organization.unassigned")
            }
            disabled
            className="h-10 rounded-lg border-[#d2d2d7] text-[15px] bg-[#f5f5f7] text-[#86868b] disabled:opacity-100"
          />
        </div>
      </div>

      <p className="mt-3 text-[12px] text-[#86868b]">
        {t("organization.adminHint")}
      </p>

      <Button
        onClick={handleSubmit}
        disabled={isPending}
        className="mt-6"
      >
        {isPending
          ? t("buttons.updating")
          : t("buttons.update")}
      </Button>
    </div>
  );
}

function SecurityForm() {
  const t = useTranslations("profile");
  const [isPending, startTransition] = useTransition();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error(t("messages.allFieldsRequired"));
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t("messages.passwordMismatch"));
      return;
    }

    startTransition(async () => {
      const result = await changePassword({
        currentPassword,
        newPassword,
      });

      if (result.success) {
        toast.success(t("messages.passwordUpdated"));

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
          <Label className="text-[13px] font-medium text-[#6e6e73]">
            {t("security.currentPassword")}
          </Label>

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
            <Label className="text-[13px] font-medium text-[#6e6e73]">
              {t("security.newPassword")}
            </Label>

            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isPending}
              className="h-10 rounded-lg border-[#d2d2d7] text-[15px] focus-visible:ring-[#0071e3]/25 focus-visible:border-[#0071e3]"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-[#6e6e73]">
              {t("security.confirmPassword")}
            </Label>

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
        {isPending
          ? t("buttons.updating")
          : t("buttons.update")}
      </Button>
    </div>
  );
}

export default function AccountTabs({ user }: Props) {
  const t = useTranslations("profile");
  const [tab, setTab] = useState<TabId>("account");

  return (
    <div className="rounded-[18px] border border-[#d2d2d7] bg-white px-7 py-6">
      <div className="flex items-center gap-6 border-b border-[#d2d2d7]">
        {TABS.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={
              "pb-3 text-[15px] font-medium border-b-2 -mb-px transition-colors " +
              (tab === item.id
                ? "text-[#1d1d1f] border-[#e30013]"
                : "text-[#86868b] border-transparent hover:text-[#1d1d1f]")
            }
          >
            {t(`tabs.${item.label}`)}
          </button>
        ))}
      </div>

      {tab === "account" ? (
        <AccountForm user={user} />
      ) : (
        <SecurityForm />
      )}
    </div>
  );
}