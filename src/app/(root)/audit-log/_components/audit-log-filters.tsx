"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "@/types/audit.types";

const ALL = "__all__";

interface Props {
  users: { id: string; name: string }[];
}

// Audit-log filtri: Kassa sahifasidagi CashFilters bilan bir xil
// pattern — holat URL'da saqlanadi (?user=&type=&action=&from=&to=),
// shuning uchun sahifa server tomonda filtrlanadi va havolani
// ulashish/yangilash mumkin.
export function AuditLogFilters({ users }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const t = useTranslations("audit-log");

  const user = searchParams.get("user") ?? ALL;
  const type = searchParams.get("type") ?? ALL;
  const action = searchParams.get("action") ?? ALL;
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  const hasFilter =
    user !== ALL || type !== ALL || action !== ALL || !!from || !!to;

  const update = (
    key: "user" | "type" | "action" | "from" | "to",
    value: string | null
  ) => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("page");

    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }

    const qs = next.toString();
    router.push(qs ? `/audit-log?${qs}` : "/audit-log");
  };

  const reset = () => router.push("/audit-log");

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1.5 min-w-52">
        <Label>{t("filters.user")}</Label>

        <Select
          value={user}
          onValueChange={(v) => update("user", v === ALL ? null : v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value={ALL}>{t("filters.allUsers")}</SelectItem>

            {users.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5 min-w-52">
        <Label>{t("filters.entityType")}</Label>

        <Select
          value={type}
          onValueChange={(v) => update("type", v === ALL ? null : v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value={ALL}>{t("filters.allTypes")}</SelectItem>

            {AUDIT_ENTITY_TYPES.map((et) => (
              <SelectItem key={et} value={et}>
                {t(`entityTypes.${et}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5 min-w-44">
        <Label>{t("filters.action")}</Label>

        <Select
          value={action}
          onValueChange={(v) => update("action", v === ALL ? null : v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value={ALL}>{t("filters.allActions")}</SelectItem>

            {AUDIT_ACTIONS.map((a) => (
              <SelectItem key={a} value={a}>
                {t(`actions.${a}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>{t("filters.dateFrom")}</Label>

        <Input
          type="date"
          value={from}
          onChange={(e) => update("from", e.target.value || null)}
          className="w-40"
        />
      </div>

      <div className="space-y-1.5">
        <Label>{t("filters.dateTo")}</Label>

        <Input
          type="date"
          value={to}
          onChange={(e) => update("to", e.target.value || null)}
          className="w-40"
        />
      </div>

      {hasFilter && (
        <Button variant="ghost" size="sm" onClick={reset}>
          <X className="w-4 h-4 mr-1" />
          {t("filters.reset")}
        </Button>
      )}
    </div>
  );
}
