"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { IPoint } from "@/types/point.types";
import {
  useCreatePoint,
  useUpdatePoint,
} from "../_hooks/use-point-mutations";

import { useTranslations } from "next-intl";

interface Props {
  point?: IPoint;
  onClose?: () => void;
}

export function PointForm({ point, onClose }: Props) {
  const router = useRouter();

  const t = useTranslations("point.form");

  const [name, setName] = useState(
    point?.name ?? ""
  );

  const handleClose = () => {
    if (onClose) onClose();
    else router.push("/points");
  };

  const onDone = () => {
    router.refresh();
    handleClose();
  };

  const {
    mutate: create,
    isPending: isCreating,
  } = useCreatePoint(onDone);

  const {
    mutate: update,
    isPending: isUpdating,
  } = useUpdatePoint(onDone);

  const isPending =
    isCreating || isUpdating;

  const handleSubmit = () => {
    if (point) {
      update({
        id: point.id,
        name,
      });
    } else {
      create({ name });
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <MapPin className="w-4 h-4" />

          {point
            ? t("editPoint")
            : t("newPoint")}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="space-y-1.5">
          <Label>{t("name")}</Label>

          <Input
            placeholder={t("namePlaceholder")}
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
          />
        </div>
      </div>

      <div className="p-4 border-t flex justify-end gap-2">
        <Button
          variant="ghost"
          onClick={handleClose}
        >
          {t("cancel")}
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={
            isPending || !name.trim()
          }
        >
          {isPending
            ? t("saving")
            : t("save")}
        </Button>
      </div>
    </div>
  );
}