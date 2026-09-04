"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { UserPlus } from "lucide-react";

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

import { ROLES, type Role } from "@/types/role.types";
import type { IPointOption } from "@/types/point.types";
import { useCreateUser } from "../_hooks/use-user-mutations";

interface Props {
  points: IPointOption[];
  onClose?: () => void;
}

export function UserForm({ points, onClose }: Props) {
  const router = useRouter();
  const t = useTranslations("users.form");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("CASHIER");
  const [pointId, setPointId] = useState<string>("");

  const { mutate, isPending } = useCreateUser(() => {
    router.refresh();

    if (onClose) {
      onClose();
    } else {
      router.push("/users");
    }
  });

  const handleClose = () => {
    if (onClose) onClose();
    else router.push("/users");
  };

  const handleSubmit = () => {
    mutate({
      name,
      email,
      password,
      role,
      pointId: pointId || undefined,
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          {t("newUser")}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="space-y-1.5">
          <Label>{t("name")}</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label>{t("email")}</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label>{t("password")}</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("passwordPlaceholder")}
          />
        </div>

        <div className="space-y-1.5">
          <Label>{t("role")}</Label>

          <Select
            value={role}
            onValueChange={(v) => setRole(v as Role)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="p-4 border-t flex justify-end gap-2">
        <Button variant="ghost" onClick={handleClose}>
          {t("cancel")}
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={
            isPending ||
            !name ||
            !email ||
            password.length < 8
          }
        >
          {isPending ? t("creating") : t("createUser")}
        </Button>
      </div>
    </div>
  );
}