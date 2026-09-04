"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Handshake } from "lucide-react";

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

import type { IContragent, ContragentType } from "@/types/contragent.types";

import {
  useCreateContragent,
  useUpdateContragent,
} from "../_hooks/use-contragent-mutations";

interface Props {
  contragent?: IContragent;
  onClose?: () => void;
}

export function ContragentForm({ contragent, onClose }: Props) {
  const router = useRouter();
  const t = useTranslations("contragent.form");

  const [name, setName] = useState(contragent?.name ?? "");
  const [phone, setPhone] = useState(contragent?.phone ?? "");
  const [inn, setInn] = useState(contragent?.inn ?? "");
  const [type, setType] = useState<ContragentType>(
    contragent?.type ?? "SUPPLIER"
  );

  const handleClose = () => {
    if (onClose) onClose();
    else router.push("/contragents");
  };

  const onDone = () => {
    router.refresh();
    handleClose();
  };

  const { mutate: create, isPending: isCreating } =
    useCreateContragent(onDone);

  const { mutate: update, isPending: isUpdating } =
    useUpdateContragent(onDone);

  const isPending = isCreating || isUpdating;

  const handleSubmit = () => {
    if (contragent)
      update({
        id: contragent.id,
        name,
        phone: phone || undefined,
        inn: inn || undefined,
        type,
      });
    else create({ name, phone: phone || undefined, type });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <Handshake className="w-4 h-4" />
          {contragent ? t("editContragent") : t("newContragent")}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="space-y-1.5">
          <Label>{t("name")}</Label>
          <Input
            placeholder={t("namePlaceholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label>{t("inn")}</Label>
          <Input value={inn} onChange={(e) => setInn(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label>{t("phone")}</Label>
          <Input
            placeholder={t("phonePlaceholder")}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label>{t("type")}</Label>

          <Select
            value={type}
            onValueChange={(v) => setType(v as ContragentType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="SUPPLIER">
                {t("supplier")}
              </SelectItem>
              <SelectItem value="BUYER">
                {t("buyer")}
              </SelectItem>
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
          disabled={isPending || !name.trim()}
        >
          {isPending ? t("saving") : t("save")}
        </Button>
      </div>
    </div>
  );
}